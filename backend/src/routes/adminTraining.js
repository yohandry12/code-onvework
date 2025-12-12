const express = require("express");
// AJOUT : Import de Activity pour les notifications
const {
  Training,
  User,
  TrainerProfile,
  Activity,
  Module,
  Lesson,
  sequelize,
} = require("../models");
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

  // --- 6. DELETE /api/admin/trainings/:id - Supprimer une formation ---
  router.delete("/:id", async (req, res) => {
    try {
      const training = await Training.findByPk(req.params.id);
      if (!training)
        return res.status(404).json({ error: "Formation introuvable" });

      await training.destroy(); // Suppression en cascade (modules/leçons) gérée par Sequelize si configuré, sinon le faire manuellement

      logger.info(
        `Formation ${req.params.id} supprimée par admin ${req.user.id}`
      );
      res.json({ success: true, message: "Formation supprimée" });
    } catch (error) {
      logger.error("Erreur admin delete training:", error);
      res
        .status(500)
        .json({ error: "Impossible de supprimer (conflits possibles)" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const training = await Training.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "trainer",
            attributes: ["id", "email"],
            include: [{ model: TrainerProfile, as: "trainerProfile" }],
          },
          {
            model: Module,
            as: "modules",
            include: [{ model: Lesson, as: "lessons" }],
          },
        ],
      });

      if (!training)
        return res.status(404).json({ error: "Formation introuvable" });

      res.json({ success: true, training });
    } catch (error) {
      logger.error("Erreur admin detail training:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // --- 5. PUT /api/admin/trainings/:id - Modifier une formation ---
  router.put("/:id", async (req, res) => {
    // On utilise une transaction car on va toucher à plusieurs tables
    const t = await sequelize.transaction();

    try {
      const trainingId = req.params.id;
      const {
        title,
        description,
        price,
        status,
        category,
        level,
        duration,
        discountPrice,
        objectives,
        prerequisites,
        subtitle,
        trainerId, // <-- Étape 0 : Changement de formateur possible
        modules, // <-- Tableau complet des modules
      } = req.body;

      const training = await Training.findByPk(trainingId);
      if (!training) {
        await t.rollback();
        return res.status(404).json({ error: "Formation introuvable" });
      }

      // --- CALCUL DES TOTAUX AVANT INSERTION ---
      const calculatedTotalModules = modules ? modules.length : 0;
      const calculatedTotalLessons = modules
        ? modules.reduce(
            (acc, m) => acc + (m.lessons ? m.lessons.length : 0),
            0
          )
        : 0;

      // 1. Mise à jour des infos de base
      await training.update(
        {
          title,
          description,
          price,
          status,
          category,
          level,
          duration,
          discountPrice,
          objectives,
          prerequisites,
          subtitle,
          totalModules: calculatedTotalModules,
          totalLessons: calculatedTotalLessons,
          trainerId: trainerId || training.trainerId, // On change le propriétaire si fourni
        },
        { transaction: t }
      );

      // 2. Gestion des Modules & Leçons (Nested Update)
      if (modules && Array.isArray(modules)) {
        // A. Récupérer les modules existants pour savoir quoi supprimer
        const existingModules = await Module.findAll({
          where: { trainingId },
          attributes: ["id"],
          transaction: t,
        });
        const existingModuleIds = existingModules.map((m) => m.id);

        // IDs des modules reçus du front (ceux qui existent déjà)
        const incomingModuleIds = modules.filter((m) => m.id).map((m) => m.id);

        // Modules à supprimer (ceux qui sont en base mais pas dans la nouvelle liste)
        const modulesToDelete = existingModuleIds.filter(
          (id) => !incomingModuleIds.includes(id)
        );

        if (modulesToDelete.length > 0) {
          await Module.destroy({
            where: { id: modulesToDelete },
            transaction: t,
          });
        }

        // B. Itérer sur les modules reçus
        for (const [mIndex, modData] of modules.entries()) {
          let currentModule;

          if (modData.id) {
            // UPDATE MODULE
            currentModule = await Module.findByPk(modData.id, {
              transaction: t,
            });
            if (currentModule) {
              await currentModule.update(
                {
                  title: modData.title,
                  description: modData.description,
                  orderIndex: mIndex,
                },
                { transaction: t }
              );
            }
          } else {
            // CREATE MODULE
            currentModule = await Module.create(
              {
                trainingId,
                title: modData.title,
                description: modData.description,
                orderIndex: mIndex,
              },
              { transaction: t }
            );
          }

          // C. Gestion des Leçons pour ce module
          if (modData.lessons && Array.isArray(modData.lessons)) {
            // Même logique : supprimer les leçons qui ne sont plus là
            const existingLessons = await Lesson.findAll({
              where: { moduleId: currentModule.id },
              attributes: ["id"],
              transaction: t,
            });
            const existingLessonIds = existingLessons.map((l) => l.id);
            const incomingLessonIds = modData.lessons
              .filter((l) => l.id)
              .map((l) => l.id);

            const lessonsToDelete = existingLessonIds.filter(
              (id) => !incomingLessonIds.includes(id)
            );
            if (lessonsToDelete.length > 0) {
              await Lesson.destroy({
                where: { id: lessonsToDelete },
                transaction: t,
              });
            }

            for (const [lIndex, lesData] of modData.lessons.entries()) {
              if (lesData.id) {
                // UPDATE LESSON
                await Lesson.update(
                  {
                    title: lesData.title,
                    type: lesData.type,
                    content: lesData.content,
                    videoUrl: lesData.videoUrl,
                    duration: lesData.duration,
                    quizData: lesData.quizData,
                    orderIndex: lIndex,
                  },
                  { where: { id: lesData.id }, transaction: t }
                );
              } else {
                // CREATE LESSON
                await Lesson.create(
                  {
                    moduleId: currentModule.id,
                    trainingId, // Redondance
                    title: lesData.title,
                    type: lesData.type,
                    content: lesData.content,
                    videoUrl: lesData.videoUrl,
                    duration: lesData.duration,
                    quizData: lesData.quizData,
                    orderIndex: lIndex,
                    isFreePreview: lesData.isFreePreview || false,
                  },
                  { transaction: t }
                );
              }
            }
          }
        }
      }

      await t.commit();
      logger.info(
        `Formation ${training.id} mise à jour complètement par admin ${req.user.id}`
      );

      res.json({ success: true, training });
    } catch (error) {
      await t.rollback();
      logger.error("Erreur admin update training:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  return router;
};
