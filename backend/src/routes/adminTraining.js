const express = require("express");
// AJOUT : Import de Activity pour les notifications
const { Training, User, TrainerProfile, Activity } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

module.exports = function (io) {
  const router = express.Router();

  // Sécurité : Seul un admin peut accéder à ces routes
  router.use(authenticateToken, requireRole("admin"));

  // --- 1. GET /api/admin/trainings - Lister les formations ---
  router.get("/", async (req, res) => {
    try {
      const { trainerId, status, search, page = 1, limit = 15 } = req.query;

      const whereClause = {};

      if (trainerId) {
        whereClause.trainerId = parseInt(trainerId, 10);
      }

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.title = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await Training.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "trainer",
            attributes: ["id", "email"],
            include: [
              {
                model: TrainerProfile,
                as: "trainerProfile",
                attributes: ["firstName", "lastName"],
              },
            ],
          },
        ],
      });

      const formattedTrainings = rows.map((t) => t.get({ plain: true }));

      res.json({
        success: true,
        trainings: formattedTrainings,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      logger.error("Erreur admin/trainings:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  // --- 2. PATCH /api/admin/trainings/:id/approve - Valider une formation ---
  router.patch("/:id/approve", async (req, res) => {
    try {
      const training = await Training.findByPk(req.params.id);

      if (!training) {
        return res
          .status(404)
          .json({ success: false, error: "Formation introuvable" });
      }

      // Optionnel : Vérifier si elle est bien en attente (selon votre logique métier)
      // if (training.status !== 'pending') ...

      training.status = "published";
      await training.save();

      // 1. Créer une activité (Notification persistante)
      const activity = await Activity.create({
        userId: training.trainerId, // Notifier le formateur
        type: "training-approved",
        message: `Félicitations ! Votre formation "${training.title}" a été validée et est maintenant en ligne.`,
        referenceId: training.id,
        referenceType: "training",
        status: "success", // Vert
      });

      // 2. Notification Temps Réel (Socket.io)
      io.to(`user-${training.trainerId}`).emit("activity", activity);

      // Événement spécifique pour rafraîchir les listes côté client si besoin
      io.to(`user-${training.trainerId}`).emit("training-updated", {
        id: training.id,
        status: "published",
      });

      logger.info(
        `Formation ${training.id} approuvée par l'admin ${req.user.id}`
      );

      res.json({ success: true, training });
    } catch (error) {
      logger.error("Erreur approbation formation:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // --- 3. PATCH /api/admin/trainings/:id/reject - Rejeter une formation ---
  router.patch("/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body; // L'admin peut fournir une raison
      const training = await Training.findByPk(req.params.id);

      if (!training) {
        return res
          .status(404)
          .json({ success: false, error: "Formation introuvable" });
      }

      training.status = "rejected";
      await training.save();

      // Message de notification avec la raison
      const message = reason
        ? `Votre formation "${training.title}" a été refusée. Motif : ${reason}`
        : `Votre formation "${training.title}" a été refusée. Veuillez vérifier qu'elle respecte nos critères.`;

      // 1. Créer une activité
      const activity = await Activity.create({
        userId: training.trainerId,
        type: "training-rejected",
        message: message,
        referenceId: training.id,
        referenceType: "training",
        status: "error", // Rouge
      });

      // 2. Notification Temps Réel
      io.to(`user-${training.trainerId}`).emit("activity", activity);
      io.to(`user-${training.trainerId}`).emit("training-updated", {
        id: training.id,
        status: "rejected",
      });

      logger.info(
        `Formation ${training.id} rejetée par l'admin ${req.user.id}`
      );

      res.json({ success: true, training });
    } catch (error) {
      logger.error("Erreur rejet formation:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  return router;
};
