const express = require("express");
const { Activity } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");

module.exports = function (io) {
  const router = express.Router();

  // GET /api/activities/recent - dernières activités pour l'utilisateur
  router.get("/recent", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 20;
      const activities = await Activity.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit,
      });
      res.json({ success: true, activities });
    } catch (error) {
      logger.error("Erreur récupération activités:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // POST /api/activities/:id/read - marquer comme lu
  router.post("/:id/read", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const activity = await Activity.findByPk(id);
      if (!activity)
        return res
          .status(404)
          .json({ success: false, error: "Activité introuvable" });
      if (activity.userId !== req.user.id)
        return res.status(403).json({ success: false, error: "Accès refusé" });
      activity.read = true;
      await activity.save();
      // émettre event socket pour mise à jour
      io.to(`user-${req.user.id}`).emit("activity-updated", {
        id: activity.id,
        read: true,
      });
      res.json({ success: true, activity });
    } catch (error) {
      logger.error("Erreur marquer lu activité:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // DELETE /api/activities/:id - supprimer
  router.delete("/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const activity = await Activity.findByPk(id);
      if (!activity)
        return res
          .status(404)
          .json({ success: false, error: "Activité introuvable" });
      if (activity.userId !== req.user.id)
        return res.status(403).json({ success: false, error: "Accès refusé" });
      await activity.destroy();
      io.to(`user-${req.user.id}`).emit("activity-removed", { id });
      res.json({ success: true });
    } catch (error) {
      logger.error("Erreur suppression activité:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // Utilitaire pour créer une activité (à appeler depuis d'autres routes)
  router.createActivity = async function ({
    userId,
    type = "info",
    message,
    referenceId = null,
    referenceType = null,
    status = "info",
    meta = null,
  }) {
    try {
      const activity = await Activity.create({
        userId,
        type,
        message,
        referenceId,
        referenceType,
        status,
        meta,
      });
      // émettre via socket
      io.to(`user-${userId}`).emit("activity", activity);
      return activity;
    } catch (error) {
      logger.error("Erreur création activité:", error);
      throw error;
    }
  };

  return router;
};
