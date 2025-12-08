const express = require("express");
const { User, UserSettings } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const { PlatformSetting, sequelize } = require("../models");
const { getDistributionRates } = require("../utils/finance");

const router = express.Router();

// Toutes les routes ici nécessitent une authentification
router.use(authenticateToken);

// --- GET /api/settings : Récupérer les paramètres de l'utilisateur ---
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    // On cherche les paramètres. Si ils n'existent pas, on les crée.
    // `findOrCreate` est parfait pour ça.
    const [settings, created] = await UserSettings.findOrCreate({
      where: { userId },
      // Les valeurs par défaut sont définies dans le modèle,
      // donc on n'a pas besoin de les spécifier ici.
    });

    if (created) {
      logger.info(`Paramètres créés pour l'utilisateur ${userId}`);
    }

    res.json({ success: true, settings });
  } catch (error) {
    logger.error("Erreur récupération des paramètres:", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// --- PUT /api/settings : Mettre à jour les paramètres de l'utilisateur ---
router.put("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // On cherche d'abord les paramètres de l'utilisateur
    let settings = await UserSettings.findOne({ where: { userId } });

    if (!settings) {
      // Si pour une raison quelconque ils n'existent pas, on les crée
      settings = await UserSettings.create({ userId, ...updates });
    } else {
      // Sinon, on les met à jour
      await settings.update(updates);
    }

    res.json({
      success: true,
      settings,
      message: "Paramètres mis à jour avec succès.",
    });
  } catch (error) {
    logger.error("Erreur mise à jour des paramètres:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(". "),
      });
    }
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// GET /api/settings/finance - Récupérer les taux (Public ou Auth selon besoin)
router.get("/finance", async (req, res) => {
  try {
    // On utilise l'utilitaire qui renvoie des décimales (ex: 0.7)
    const rates = await getDistributionRates();
    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// --- AJOUT : PUT /api/settings/finance (Admin seulement) ---
router.put(
  "/finance",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { candidate, training, platform } = req.body;

      // 1. Validation : Le total doit faire 100
      const total = Number(candidate) + Number(training) + Number(platform);
      if (total !== 100) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Le total des pourcentages doit être égal à 100%. Actuellement : ${total}%`,
        });
      }

      // 2. Mise à jour en base de données
      // On met à jour chaque clé individuellement
      await PlatformSetting.update(
        { value: candidate },
        { where: { key: "rate_candidate" }, transaction: t }
      );
      await PlatformSetting.update(
        { value: training },
        { where: { key: "rate_training" }, transaction: t }
      );
      await PlatformSetting.update(
        { value: platform },
        { where: { key: "rate_platform" }, transaction: t }
      );

      await t.commit();

      res.json({ success: true, message: "Taux mis à jour avec succès." });
    } catch (error) {
      await t.rollback();
      console.error("Erreur update finance:", error);
      res.status(500).json({
        success: false,
        error: "Erreur serveur lors de la mise à jour.",
      });
    }
  }
);
module.exports = router;
