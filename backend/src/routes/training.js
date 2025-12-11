const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const {
  Training,
  Module,
  Lesson,
  User,
  TrainerProfile,
  CandidateProfile,
  Enrollment,
  Activity,
  Review,
  sequelize,
} = require("../models");
const {
  authenticateToken,
  requireRole,
  optionalAuth,
} = require("../middleware/auth");
const upload = require("../middleware/upload");
const { logger } = require("../utils/logger");

module.exports = function (io) {
  const router = express.Router();
  // Middleware pour vérifier que l'utilisateur est bien un formateur
  const isTrainer = [authenticateToken, requireRole("trainer", "admin")];

  // --- A & B. CRÉATION D'UNE FORMATION COMPLÈTE (Nested) ---
  // Cette route permet de créer la formation seule OU la formation avec ses modules et leçons d'un coup
  router.post("/", isTrainer, async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const trainerId = req.user.id;
      const {
        title,
        description,
        category,
        subCategory,
        level,
        language,
        objectives,
        prerequisites,
        price,
        discountPrice,
        thumbnail,
        trailerUrl,
        modules, // Array of modules, containing array of lessons
      } = req.body;

      const initialStatus = req.user.role === "admin" ? "published" : "pending";

      // 1. Création de la Formation parente
      const newTraining = await Training.create(
        {
          trainerId,
          title,
          description,
          category,
          subCategory,
          level,
          language,
          objectives, // Sequelize gère automatiquement le JSON
          prerequisites,
          price,
          discountPrice,
          thumbnail,
          trailerUrl,
          status: initialStatus, // Toujours brouillon à la création
        },
        { transaction: t }
      );

      // 2. Gestion des Modules et Leçons imbriqués (si fournis)
      if (modules && modules.length > 0) {
        for (const [mIndex, mod] of modules.entries()) {
          const newModule = await Module.create(
            {
              trainingId: newTraining.id,
              title: mod.title,
              description: mod.description,
              orderIndex: mIndex,
            },
            { transaction: t }
          );

          if (mod.lessons && mod.lessons.length > 0) {
            for (const [lIndex, les] of mod.lessons.entries()) {
              await Lesson.create(
                {
                  moduleId: newModule.id,
                  trainingId: newTraining.id, // Redondance requise par le modèle
                  title: les.title,
                  type: les.type || "video",
                  content: les.content,
                  videoUrl: les.videoUrl,
                  duration: les.duration || 0,
                  isFreePreview: les.isFreePreview || false,
                  orderIndex: lIndex,
                  quizData: les.quizData, // JSON
                  resources: les.resources, // JSON
                },
                { transaction: t }
              );
            }
          }
        }
      }

      // Recalculer les totaux (Modules, Leçons, Durée)
      // On peut faire ça via une fonction utilitaire ou ici directement
      // Pour simplifier, on commit d'abord
      await t.commit();

      // Récupérer la formation complète pour la renvoyer
      const fullTraining = await Training.findByPk(newTraining.id, {
        include: [
          {
            model: Module,
            as: "modules",
            include: [{ model: Lesson, as: "lessons" }],
          },
        ],
      });

      // --- NOTIFICATION ET ACTIVITÉ ---

      // 1. Notifier le formateur
      const activityMessage =
        req.user.role === "admin"
          ? `Formation créée et publiée : "${title}"`
          : `Votre formation "${title}" a été soumise et est en attente de validation.`;

      const activity = await Activity.create({
        userId: trainerId,
        type: "training", // Assurez-vous que ce type est géré front
        message: activityMessage,
        referenceId: newTraining.id,
        referenceType: "training",
        status: "info",
      });

      io.to(`user-${trainerId}`).emit("activity", activity);

      logger.info(`Nouvelle formation créée par ${trainerId}: ${title}`);
      res.status(201).json({ success: true, training: fullTraining });
    } catch (error) {
      await t.rollback();
      logger.error("Erreur création formation:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- MISE À JOUR D'UNE FORMATION (Général) ---
  router.put("/:id", isTrainer, async (req, res) => {
    try {
      const trainingId = req.params.id;
      const trainerId = req.user.id;

      const training = await Training.findOne({
        where: { id: trainingId, trainerId },
      });

      if (!training) {
        return res
          .status(404)
          .json({ success: false, error: "Formation introuvable." });
      }

      // Mise à jour des champs simples
      await training.update(req.body);

      res.json({ success: true, message: "Formation mise à jour.", training });
    } catch (error) {
      logger.error("Erreur update formation:", error);
      res.status(500).json({ success: false, error: "Erreur serveur." });
    }
  });

  // --- GESTION DES MODULES (Ajouter un module après coup) ---
  router.post("/:id/modules", isTrainer, async (req, res) => {
    try {
      const trainingId = req.params.id;
      const { title, description, orderIndex } = req.body;

      // Vérifier appartenance
      const training = await Training.findOne({
        where: { id: trainingId, trainerId: req.user.id },
      });
      if (!training) return res.status(403).json({ error: "Accès refusé" });

      const module = await Module.create({
        trainingId,
        title,
        description,
        orderIndex: orderIndex || 0,
      });

      // Incrémenter le compteur de modules dans Training
      await training.increment("totalModules");

      res.status(201).json({ success: true, module });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- GESTION DES LEÇONS (Ajouter une leçon dans un module) ---
  router.post("/modules/:moduleId/lessons", isTrainer, async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { moduleId } = req.params;
      // On doit récupérer le module pour avoir le trainingId
      const module = await Module.findByPk(moduleId);
      if (!module) throw new Error("Module introuvable");

      // Vérifier que le formateur est bien le propriétaire via le Training
      const training = await Training.findOne({
        where: { id: module.trainingId, trainerId: req.user.id },
        transaction: t,
      });

      if (!training) {
        await t.rollback();
        return res.status(403).json({ error: "Accès refusé." });
      }

      const { title, type, content, videoUrl, duration, quizData } = req.body;

      // Création de la leçon
      const lesson = await Lesson.create(
        {
          moduleId,
          trainingId: training.id, // Important pour la redondance
          title,
          type,
          content,
          videoUrl,
          duration,
          quizData,
          orderIndex: req.body.orderIndex || 0,
        },
        { transaction: t }
      );

      // Mise à jour des compteurs globaux
      await training.increment("totalLessons", { transaction: t });
      if (duration) {
        await training.increment("duration", { by: duration, transaction: t });
      }
      // Mise à jour durée module
      if (duration) {
        await module.increment("duration", { by: duration, transaction: t });
      }

      await t.commit();
      res.status(201).json({ success: true, lesson });
    } catch (error) {
      await t.rollback();
      logger.error("Erreur ajout leçon:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- GESTION DES UPLOADS (Images / Vidéos) ---
  // Route utilitaire pour uploader un fichier et récupérer l'URL avant de créer la leçon/formation
  router.post("/upload", isTrainer, upload.single("file"), (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Aucun fichier fourni" });

      // Génère l'URL (adapter selon votre config : locale ou S3)
      const fileUrl = `/api/uploads/${req.file.filename}`; // Exemple local

      // Idéalement, ici on déterminerait le type (image vs video) pour le renvoyer
      res.json({ success: true, url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ error: "Erreur upload" });
    }
  });

  // --- G. HISTORIQUE & LECTURE ---
  // Récupérer toutes les formations du formateur connecté
  router.get("/my-trainings", isTrainer, async (req, res) => {
    try {
      const trainings = await Training.findAll({
        where: { trainerId: req.user.id },
        order: [["updatedAt", "DESC"]],
        // On n'inclut pas tout le contenu pour alléger la liste
        attributes: [
          "id",
          "title",
          "thumbnail",
          "price",
          "status",
          "totalStudents",
          "createdAt",
        ],
      });
      res.json({ success: true, trainings });
    } catch (error) {
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  router.get("/public", async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        category,
        level,
        priceType,
      } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        status: "published", // SEULEMENT LES COURS VALIDÉS
      };

      if (category) whereClause.category = category;
      if (level) whereClause.level = level;

      if (priceType === "free") whereClause.price = 0;
      if (priceType === "paid") whereClause.price = { [Op.gt]: 0 };

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Training.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "trainer",
            attributes: ["id"],
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

      res.json({ success: true, trainings: rows, total: count });
    } catch (error) {
      logger.error("Erreur public trainings:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Récupérer une formation complète pour édition (avec modules et leçons)
  router.get("/:id/edit", isTrainer, async (req, res) => {
    try {
      const training = await Training.findOne({
        where: { id: req.params.id, trainerId: req.user.id },
        include: [
          {
            model: Module,
            as: "modules",
            include: [{ model: Lesson, as: "lessons" }],
          },
        ],
        order: [
          [{ model: Module, as: "modules" }, "orderIndex", "ASC"],
          [
            { model: Module, as: "modules" },
            { model: Lesson, as: "lessons" },
            "orderIndex",
            "ASC",
          ],
        ],
      });

      if (!training)
        return res.status(404).json({ error: "Formation introuvable" });

      res.json({ success: true, training });
    } catch (error) {
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // --- Suppression d'une formation ---
  router.delete("/:id", isTrainer, async (req, res) => {
    try {
      const deleted = await Training.destroy({
        where: { id: req.params.id, trainerId: req.user.id },
      });

      if (!deleted) return res.status(404).json({ error: "Introuvable" });

      res.json({ success: true, message: "Formation supprimée" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Impossible de supprimer (inscriptions actives ?)" });
    }
  });

  // --- H. ACHAT D'UNE FORMATION (Par un candidat avec ses Points) ---
  router.post(
    "/:id/enroll",
    authenticateToken,
    requireRole("candidate"),
    async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const trainingId = req.params.id;
        const candidateId = req.user.id;

        // 1. Récupérer la formation et le profil du candidat
        const training = await Training.findByPk(trainingId, {
          transaction: t,
        });
        const candidateProfile = await CandidateProfile.findOne({
          where: { userId: candidateId },
          transaction: t,
        });

        if (!training) {
          await t.rollback();
          return res.status(404).json({ error: "Formation introuvable." });
        }

        if (training.status !== "published") {
          await t.rollback();
          return res
            .status(400)
            .json({ error: "Cette formation n'est pas disponible." });
        }

        // 2. Vérifier si déjà inscrit
        const existingEnrollment = await Enrollment.findOne({
          where: { trainingId, candidateId },
          transaction: t,
        });

        if (existingEnrollment) {
          await t.rollback();
          return res
            .status(400)
            .json({ error: "Vous êtes déjà inscrit à cette formation." });
        }

        // 3. Conversion & Vérification du Solde
        // Taux : 1 FCFA = 1 Point (Ajustable ici si besoin)
        const costInPoints = Math.ceil(parseFloat(training.price));

        if (candidateProfile.trainingPoints < costInPoints) {
          await t.rollback();
          return res.status(400).json({
            error: `Solde insuffisant. Il vous faut ${costInPoints} points (Solde actuel : ${candidateProfile.trainingPoints})`,
          });
        }

        // 4. TRANSACTION : Débiter le Candidat
        await candidateProfile.decrement("trainingPoints", {
          by: costInPoints,
          transaction: t,
        });

        // 5. TRANSACTION : Créditer le Formateur (En vrai argent sur son walletBalance)
        // On récupère le profil du formateur
        const trainerProfile = await TrainerProfile.findOne({
          where: { userId: training.trainerId },
          transaction: t,
        });
        if (trainerProfile) {
          // On peut appliquer une commission ici (ex: 10% pour la plateforme)
          const platformFee = costInPoints * 0.1;
          const trainerEarnings = costInPoints - platformFee;

          await trainerProfile.increment("walletBalance", {
            by: trainerEarnings,
            transaction: t,
          });
        }

        // 6. Créer l'inscription
        await Enrollment.create(
          {
            candidateId,
            trainingId,
            progress: 0,
            amountPaid: costInPoints, // On stocke la valeur payée
            paymentStatus: "paid",
            enrolledAt: new Date(),
          },
          { transaction: t }
        );

        // 7. Mise à jour stats formation
        await training.increment("totalStudents", { transaction: t });

        await t.commit();

        // --- NOTIFICATIONS ET ACTIVITÉS (Hors Transaction) ---
        // On utilise un try/catch séparé pour ne pas faire échouer l'achat si la notif plante
        try {
          // A. Notifier le Formateur (Vente)
          const trainerActivity = await Activity.create({
            userId: training.trainerId,
            type: "sale", // Type spécifique pour icône argent/vente
            message: `Nouvel étudiant inscrit à "${training.title}". Vous avez gagné ${trainerEarnings} FCFA.`,
            referenceId: training.id,
            referenceType: "training",
            status: "success",
          });
          // Envoi Socket au formateur
          io.to(`user-${training.trainerId}`).emit("activity", trainerActivity);

          // B. Notifier le Candidat (Achat réussi)
          const candidateActivity = await Activity.create({
            userId: candidateId,
            type: "enrollment", // Type spécifique pour icône éducation
            message: `Inscription confirmée à "${training.title}". -${costInPoints} Points.`,
            referenceId: training.id,
            referenceType: "training",
            status: "success",
          });
          // Envoi Socket au candidat
          io.to(`user-${candidateId}`).emit("activity", candidateActivity);
        } catch (notifError) {
          logger.warn(
            "Erreur lors de l'envoi des notifications d'achat :",
            notifError.message
          );
        }

        logger.info(
          `Inscription réussie : Candidat ${candidateId} -> Formation ${trainingId}`
        );

        res.status(201).json({
          success: true,
          message: "Inscription réussie ! Vous pouvez commencer le cours.",
        });
      } catch (error) {
        await t.rollback();
        logger.error("Erreur achat formation:", error);
        res
          .status(500)
          .json({ success: false, error: "Erreur lors de l'inscription." });
      }
    }
  );

  // --- I. AJOUTER UN AVIS (NOTE) ---
  router.post(
    "/:id/review",
    authenticateToken,
    requireRole("candidate"),
    async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const trainingId = req.params.id;
        const { rating, comment } = req.body;
        const studentId = req.user.id;

        // 1. Vérifications
        const training = await Training.findByPk(trainingId);
        if (!training) {
          await t.rollback();
          return res.status(404).json({ error: "Formation introuvable" });
        }

        // Vérifier si l'utilisateur est inscrit
        const enrollment = await Enrollment.findOne({
          where: { trainingId, candidateId: studentId },
        });
        if (!enrollment) {
          await t.rollback();
          return res
            .status(403)
            .json({ error: "Vous devez être inscrit pour noter ce cours." });
        }

        // Vérifier s'il a déjà noté
        const existingReview = await Review.findOne({
          where: { trainingId, userId: studentId },
        });
        if (existingReview) {
          await t.rollback();
          return res
            .status(400)
            .json({ error: "Vous avez déjà noté ce cours." });
        }

        // 2. Créer l'avis
        await Review.create(
          {
            userId: studentId,
            trainingId,
            trainerId: training.trainerId,
            rating,
            comment,
          },
          { transaction: t }
        );

        // 3. Recalculer la note moyenne de la FORMATION
        const trainingStats = await Review.findOne({
          where: { trainingId },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
          ],
          transaction: t,
        });

        const newTrainingRating = parseFloat(
          trainingStats.dataValues.avgRating || 0
        ).toFixed(1);

        await training.update(
          { averageRating: newTrainingRating },
          { transaction: t }
        );

        await t.commit();

        // Notification au formateur
        const activity = await Activity.create({
          userId: training.trainerId,
          type: "review",
          message: `Nouvel avis (${rating}/5) sur votre formation "${training.title}".`,
          referenceId: training.id,
          referenceType: "training",
          status: "info",
        });
        io.to(`user-${training.trainerId}`).emit("activity", activity);

        res
          .status(201)
          .json({ success: true, message: "Merci pour votre avis !" });
      } catch (error) {
        await t.rollback();
        logger.error("Erreur ajout avis:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
      }
    }
  );

  router.get("/:id/public-detail", optionalAuth, async (req, res) => {
    try {
      const trainingId = req.params.id;
      const userId = req.user?.id; // Peut être undefined si visiteur non connecté

      const training = await Training.findByPk(trainingId, {
        include: [
          {
            model: Module,
            as: "modules",
            include: [
              {
                model: Lesson,
                as: "lessons",
                attributes: [
                  "id",
                  "title",
                  "type",
                  "duration",
                  "isFreePreview",
                ],
              },
            ], // On n'envoie pas le contenu/videoUrl ici pour protéger
          },
          {
            model: User,
            as: "trainer",
            attributes: ["id"],
            include: [{ model: TrainerProfile, as: "trainerProfile" }],
          },
          {
            model: Review,
            as: "reviews",
            limit: 5, // On charge les 5 derniers avis
            order: [["createdAt", "DESC"]],
            include: [
              {
                model: User,
                as: "student",
                attributes: ["id"],
                include: [
                  {
                    model: CandidateProfile,
                    as: "candidateProfile",
                    attributes: ["firstName", "lastName"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!training || training.status !== "published") {
        return res.status(404).json({ error: "Formation introuvable" });
      }

      // Vérifier si l'utilisateur est inscrit
      let hasEnrolled = false;
      let hasReviewed = false;

      if (userId) {
        const enrollment = await Enrollment.findOne({
          where: { trainingId, candidateId: userId },
        });
        hasEnrolled = !!enrollment;

        const review = await Review.findOne({ where: { trainingId, userId } });
        hasReviewed = !!review;
      }

      res.json({ success: true, training, hasEnrolled, hasReviewed });
    } catch (error) {
      logger.error("Erreur détail public:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  return router;
};
