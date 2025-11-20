const express = require("express");
const { Job, Activity } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

// On exporte une fonction qui prend io en paramètre
module.exports = function (io) {
  const router = express.Router();
  router.use(authenticateToken, requireRole("admin"));

  // GET /api/admin/jobs - Lister tous les jobs avec filtres
  router.get("/", async (req, res) => {
    const { status, isFrozen, page = 1, limit = 15 } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (isFrozen) whereClause.isFrozen = isFrozen === "true";

    const { count, rows } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      jobs: rows,
      pagination: { total: count, page, limit },
    });
  });

  // PATCH /api/admin/jobs/:id/unfreeze - Dégeler un job
  router.patch("/:id/unfreeze", async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, error: "Job non trouvé." });

    job.isFrozen = false;
    // On le remet en 'published' pour qu'il soit à nouveau visible normalement
    if (job.status === "reported") {
      job.status = "published";
    }
    await job.save();

    res.json({ success: true, job });
  });

  // PATCH /api/admin/jobs/:id/approve - Valider une offre (pending -> published)
  router.patch("/:id/approve", async (req, res) => {
    try {
      const job = await Job.findByPk(req.params.id);
      if (!job)
        return res
          .status(404)
          .json({ success: false, error: "Job non trouvé." });

      if (job.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Seules les offres en attente peuvent être approuvées.",
        });
      }

      // Mise à jour du statut uniquement sans déclencher la validation complète
      await Job.update(
        { status: "published" },
        {
          where: { id: job.id },
          validate: false, // Désactive la validation complète
          fields: ["status"], // Limite la mise à jour au champ status uniquement
        }
      );

      // Recharger le job pour avoir les données à jour
      await job.reload();

      // notifier le client
      const activity = await Activity.create({
        userId: job.clientId,
        type: "job-approved",
        message: `Votre mission "${job.title}" a été approuvée et publiée.`,
        referenceId: job.id,
        referenceType: "job",
        status: "new",
      });

      // Émettre l'événement socket si io est disponible
      try {
        io.to(`user-${job.clientId}`).emit("activity", activity);
        logger.info("Notification d'approbation envoyée au client", {
          jobId: job.id,
          clientId: job.clientId,
        });
      } catch (err) {
        logger.warn("Impossible d'émettre la notification d'approbation", {
          error: err.message,
        });
        // On continue le traitement même si l'émission socket échoue
      }

      res.json({ success: true, job });
    } catch (error) {
      console.error("Erreur approbation job:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // DELETE /api/admin/jobs/:id - Supprimer un job
  router.delete("/:id", async (req, res) => {
    const job = await Job.findByPk(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, error: "Job non trouvé." });

    await job.destroy();
    res.json({ success: true, message: "Job supprimé avec succès." });
  });

  return router;
};
