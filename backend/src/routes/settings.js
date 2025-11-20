const express = require("express");
const { User, UserSettings } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");

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

module.exports = router;
