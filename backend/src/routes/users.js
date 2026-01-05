const express = require("express");
// --- CHANGEMENT D'IMPORTS ---
const {
  User,
  CandidateProfile,
  ClientProfile,
  Activity,
  TrainerProfile,
  Review,
  Job,
  sequelize,
  Application,
  Enrollment,
  Training,
  TrainerRating,
} = require("../models"); // Importer tous les modèles nécessaires
const { Op } = require("sequelize"); // Importer les opérateurs Sequelize
const {
  authenticateToken,
  optionalAuth,
  requireRole,
} = require("../middleware/auth");
const { logger } = require("../utils/logger");
const { findMatchingJobs } = require("../services/aiMatchingService");
const { getCompletedJobsCount } = require("../utils/stats");

module.exports = function (io) {
  const router = express.Router();

  // --- GET /api/users/search - Recherche d'utilisateurs (avec tri par note) ---
  router.get("/search", async (req, res) => {
    try {
      const {
        query = "",
        role,
        candidateType,
        page = 1,
        limit = 12,
      } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // 1. Définition du Tri (Ordre de mérite)
      // Par défaut : les plus récents
      let orderClause = [["createdAt", "DESC"]];

      // Si on cherche des candidats (ou tous les rôles), on met les mieux notés en premier
      if (!role || role === "candidate") {
        orderClause = [
          // Tri principal : Note moyenne décroissante sur le modèle joint
          [
            { model: CandidateProfile, as: "candidateProfile" },
            "averageRating",
            "DESC",
          ],
          // Tri secondaire : Date de création (pour départager)
          ["createdAt", "DESC"],
        ];
      }

      const whereClause = {
        isActive: true,
      };

      if (role) {
        whereClause.role = role;
      }

      const includeOptions = [];

      // Construire la recherche textuelle
      if (query) {
        const qLower = `%${String(query).toLowerCase()}%`;

        if (!role || role === "candidate") {
          const candidateWhere = {};
          if (candidateType) {
            candidateWhere.candidateType = candidateType;
          }
          includeOptions.push({
            model: CandidateProfile,
            as: "candidateProfile",
            where: {
              [Op.or]: [
                sequelize.where(
                  sequelize.fn(
                    "LOWER",
                    sequelize.col("candidateProfile.first_name")
                  ),
                  { [Op.like]: qLower }
                ),
                sequelize.where(
                  sequelize.fn(
                    "LOWER",
                    sequelize.col("candidateProfile.last_name")
                  ),
                  { [Op.like]: qLower }
                ),
                sequelize.where(
                  sequelize.fn(
                    "LOWER",
                    sequelize.col("candidateProfile.profession")
                  ),
                  { [Op.like]: qLower }
                ),
              ],
            },
            required: !!role,
          });
        }

        if (!role || role === "client") {
          includeOptions.push({
            model: ClientProfile,
            as: "clientProfile",
            where: {
              [Op.or]: [
                sequelize.where(
                  sequelize.fn(
                    "LOWER",
                    sequelize.col("clientProfile.first_name")
                  ),
                  { [Op.like]: qLower }
                ),
                sequelize.where(
                  sequelize.fn(
                    "LOWER",
                    sequelize.col("clientProfile.last_name")
                  ),
                  { [Op.like]: qLower }
                ),
                sequelize.where(
                  sequelize.fn("LOWER", sequelize.col("clientProfile.company")),
                  { [Op.like]: qLower }
                ),
              ],
            },
            required: !!role,
          });
        }
      } else {
        // Inclure les profils même sans requête textuelle
        if (!role || role === "candidate")
          includeOptions.push({
            model: CandidateProfile,
            as: "candidateProfile",
          });
        if (!role || role === "client")
          includeOptions.push({ model: ClientProfile, as: "clientProfile" });
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        distinct: true,
        limit: limitNum,
        offset: offset,
        order: orderClause, // <--- Utilisation du tri dynamique ici
      });

      const totalPages = Math.ceil(count / limitNum);

      for (const user of rows) {
        if (user.role === "candidate" && user.candidateProfile) {
          user.candidateProfile.dataValues.completedJobs =
            await getCompletedJobsCount(user.id);
        }
      }

      res.json({
        success: true,
        users: rows.map((user) => user.getPublicProfile()),
        pagination: { currentPage: pageNum, totalPages, totalResults: count },
      });
    } catch (error) {
      logger.error("Erreur recherche utilisateurs:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // --- GET /api/users/:id/profile - Récupérer et mettre à jour le profil (traduit pour Sequelize) ---
  router.get("/:id/profile", optionalAuth, async (req, res) => {
    try {
      const userIdToView = req.params.id;
      const viewer = req.user; // Sera 'undefined' si l'utilisateur n'est pas connecté

      // Récupérer l'utilisateur à voir AVEC son profil associé
      const user = await User.findByPk(userIdToView, {
        include: [
          { model: CandidateProfile, as: "candidateProfile" },
          { model: ClientProfile, as: "clientProfile" },
          { model: TrainerProfile, as: "trainerProfile" },
        ],
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "Utilisateur non trouvé" });
      }

      // =================================================================
      // --- CORRECTION : ON VÉRIFIE D'ABORD SI LE VIEWER EXISTE ---
      // =================================================================
      if (viewer) {
        // Ces lignes ne s'exécutent QUE si l'utilisateur est connecté
        const isViewerClientOrAdmin =
          viewer.role === "client" || viewer.role === "admin";

        // Conversion en string pour être sûr de comparer les IDs correctement
        const isViewingAnotherUser = String(viewer.id) !== String(user.id);
        const isViewedUserCandidate = user.role === "candidate";

        if (
          isViewerClientOrAdmin &&
          isViewingAnotherUser &&
          isViewedUserCandidate &&
          user.candidateProfile
        ) {
          // Incrémenter le compteur sur la table de profil séparée
          await user.candidateProfile.increment("profileViewCount", { by: 1 });
          logger.info(
            `Vue du profil candidat ${user.id} incrémentée par ${viewer.id}`
          );
        }
      }
      // =================================================================

      // getPublicProfile est une méthode d'instance, elle fonctionnera toujours
      const userResponse = user.getPublicProfile();

      // Il faut manuellement attacher les données du profil si elles existent
      if (user.candidateProfile)
        userResponse.profile = user.candidateProfile.get({ plain: true });
      if (user.clientProfile)
        userResponse.profile = user.clientProfile.get({ plain: true });
      if (user.trainerProfile) {
        userResponse.profile = user.trainerProfile.get({ plain: true });
      }

      if (user.role === "candidate") {
        // Compter les candidatures avec statut 'completed' ou 'filled'
        const completedCount = await Application.count({
          where: {
            candidateId: user.id,
            status: { [Op.in]: ["completed", "filled"] }, // Vérifiez bien vos statuts en DB
          },
        });

        // On l'injecte dans la réponse
        if (userResponse.profile) {
          userResponse.profile.completedJobs = completedCount;
        }
      }

      res.json({ success: true, user: userResponse });
    } catch (error) {
      logger.error("Erreur récupération profil utilisateur:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // GET /api/users/ai-job-matches - Récupérer les suggestions de missions pour l'utilisateur connecté
  router.get("/ai-job-matches", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== "candidate") {
        return res.status(403).json({
          success: false,
          error: "Cette fonctionnalité est réservée aux candidats.",
        });
      }

      // 1. Récupérer le profil complet du candidat
      const candidateProfile = await user.getCandidateProfile();
      if (
        !candidateProfile ||
        !candidateProfile.skills ||
        candidateProfile.skills.length === 0
      ) {
        return res.json({ success: true, matches: [] }); // Pas de suggestions si le profil est vide
      }

      // 2. Récupérer une liste de jobs récents et ouverts
      const availableJobs = await Job.findAll({
        where: {
          status: "published",
          isFrozen: false,
        },
        order: [["createdAt", "DESC"]],
        limit: 50, // On donne à l'IA un échantillon récent de 50 jobs à analyser
      });

      if (availableJobs.length === 0) {
        return res.json({ success: true, matches: [] });
      }

      // 3. Appeler le service de matching IA
      const recommendedMatches = await findMatchingJobs(
        candidateProfile.get({ plain: true }),
        availableJobs
      );

      // 4. Récupérer les détails complets des jobs recommandés
      const recommendedJobIds = recommendedMatches.map((match) => match.jobId);

      const recommendedJobs = await Job.findAll({
        where: {
          id: { [Op.in]: recommendedJobIds },
        },
      });

      // 5. Fusionner les détails du job avec la raison de la recommandation
      const finalResults = recommendedMatches
        .map((match) => {
          const jobDetails = recommendedJobs.find(
            (job) => job.id === match.jobId
          );
          return { ...jobDetails.get({ plain: true }), reason: match.reason };
        })
        .filter(Boolean); // On filtre au cas où un job n'aurait pas été trouvé

      res.json({ success: true, matches: finalResults });
    } catch (error) {
      logger.error(
        "Erreur lors de la génération des suggestions de missions:",
        error
      );
      res.status(500).json({ success: false, error: "Erreur serveur." });
    }
  });

  // --- POST /api/users/convert-funds - Convertir Argent en Points ---
  router.post(
    "/convert-funds",
    authenticateToken,
    requireRole("candidate"),
    async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const { amount } = req.body;
        const userId = req.user.id;

        // Validation
        const amountToConvert = parseFloat(amount);
        if (isNaN(amountToConvert) || amountToConvert <= 0) {
          return res
            .status(400)
            .json({ success: false, error: "Montant invalide." });
        }

        // 1. Récupérer le profil
        const profile = await CandidateProfile.findOne({
          where: { userId },
          transaction: t,
        });

        if (!profile) {
          await t.rollback();
          return res
            .status(404)
            .json({ success: false, error: "Profil introuvable." });
        }

        // 2. Vérifier le solde
        const currentBalance = parseFloat(profile.walletBalance || 0);
        if (currentBalance < amountToConvert) {
          await t.rollback();
          return res
            .status(400)
            .json({ success: false, error: "Solde insuffisant." });
        }

        // 3. Effectuer la conversion (1 FCFA = 1 Point)
        const currentPoints = parseInt(profile.trainingPoints || 0);
        const pointsToAdd = Math.floor(amountToConvert); // On arrondit les points à l'entier

        await profile.update(
          {
            walletBalance: currentBalance - amountToConvert,
            trainingPoints: currentPoints + pointsToAdd,
          },
          { transaction: t }
        );

        // 4. Créer une activité (Historique)
        // Note: Assurez-vous d'importer le modèle Activity en haut du fichier si ce n'est pas fait
        /* const { Activity } = require("../models"); */
        // Ou utiliser activityCreator si disponible, sinon create direct:
        // await Activity.create({ ... }, { transaction: t });
        // Pour simplifier ici, on suppose que vous gérez l'activité ou que c'est optionnel pour l'instant.

        await t.commit();

        logger.info(
          `User ${userId} a converti ${amountToConvert} FCFA en ${pointsToAdd} points.`
        );

        res.json({
          success: true,
          message: "Conversion réussie !",
          newBalance: profile.walletBalance,
          newPoints: profile.trainingPoints,
        });
      } catch (error) {
        await t.rollback();
        logger.error("Erreur conversion fonds:", error);
        res.status(500).json({
          success: false,
          error: "Erreur serveur lors de la conversion.",
        });
      }
    }
  );

  router.post(
    "/:trainerId/rate",
    authenticateToken,
    requireRole("candidate"),
    async (req, res) => {
      try {
        const trainerId = req.params.trainerId;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
          return res
            .status(400)
            .json({ error: "La note doit être entre 1 et 5." });
        }

        // Vérifier que le formateur existe
        const trainer = await User.findByPk(trainerId);
        if (!trainer || trainer.role !== "trainer") {
          return res.status(404).json({ error: "Formateur introuvable." });
        }

        // Enregistrer la note
        const review = await TrainerRating.create({
          user_id: userId,
          trainer_id: trainerId,
          rating,
          comment,
        });

        // Mise à jour de la moyenne du formateur
        const stats = await TrainerRating.findAll({
          where: { trainer_id: trainerId },
          attributes: [[sequelize.fn("AVG", sequelize.col("rating")), "avg"]],
        });

        const newAverage = parseFloat(stats[0].avg || 0).toFixed(1);

        // --- CORRECTION ICI ---
        // On met à jour le TrainerProfile, pas le User
        await TrainerProfile.update(
          { averageRating: newAverage },
          { where: { userId: trainerId } }
        );

        // 5. Notification (Optionnel)
        const activity = await Activity.create({
          userId: trainerId,
          type: "review",
          message: `Nouvelle note (${rating}/5) reçue sur votre profil.`,
          referenceId: userId,
          referenceType: "user",
          status: "info",
        });
        io.to(`user-${trainerId}`).emit("activity", activity);

        res.json({
          message: "Notation enregistrée avec succès.",
          review,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur." });
      }
    }
  );

  router.get("/:trainerId/ratings", async (req, res) => {
    try {
      const trainerId = req.params.trainerId;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await TrainerRating.findAndCountAll({
        where: { trainer_id: trainerId },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "author", // L'étudiant qui a noté
            attributes: ["id", "email"],
            include: [
              {
                model: CandidateProfile,
                as: "candidateProfile",
                attributes: ["firstName", "lastName", "avatar"],
              },
            ],
          },
        ],
      });

      // Calcul de la moyenne pour affichage (optionnel si déjà dans le profil)
      const stats = await TrainerRating.findAll({
        where: { trainer_id: trainerId },
        attributes: [[sequelize.fn("AVG", sequelize.col("rating")), "avg"]],
        raw: true,
      });

      res.json({
        success: true,
        reviews: rows,
        total: count,
        averageRating: parseFloat(stats[0].avg || 0).toFixed(1),
      });
    } catch (error) {
      logger.error("Erreur récupération avis formateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // --- GET /api/users/wallet/history - Historique consolidé des transactions ---
  router.get(
    "/wallet/history",
    authenticateToken,
    requireRole("candidate"),
    async (req, res) => {
      try {
        const userId = req.user.id;
        // Pagination par défaut
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // On récupère plus de données que la limite pour gérer la fusion/tri correctement
        const fetchLimit = limit * 5;

        // 1. Exécution parallèle des requêtes pour la performance
        const [enrollments, activities] = await Promise.all([
          // A. Récupérer les achats de formation (Dépenses)
          Enrollment.findAll({
            where: { candidateId: userId },
            attributes: ["id", "amountPaid", "paymentStatus", "createdAt"],
            include: [
              {
                model: Training,
                as: "training",
                attributes: ["title"],
              },
            ],
            order: [["createdAt", "DESC"]],
            limit: fetchLimit,
          }),

          // B. Récupérer les activités financières (Gains, Conversions, Retraits)
          Activity.findAll({
            where: {
              userId,
              // On ne prend que les types liés à l'argent/points
              type: {
                [Op.in]: [
                  "payment_received",
                  "conversion",
                  "withdrawal",
                  "bonus",
                ],
              },
            },
            attributes: ["id", "type", "message", "createdAt", "status"],
            order: [["createdAt", "DESC"]],
            limit: fetchLimit,
          }),
        ]);

        // 2. Normalisation des données pour le Frontend
        // On transforme tout en un format unique : { id, date, type, title, amount, status, direction }

        const formattedEnrollments = enrollments.map((e) => ({
          id: `enroll-${e.id}`,
          originalId: e.id,
          date: e.createdAt,
          type: "enrollment",
          title: `Achat : ${e.training?.title || "Formation"}`,
          amount: parseFloat(e.amountPaid),
          currency: "Pts",
          direction: "out", // Sortie d'argent
          status: e.paymentStatus === "paid" ? "success" : "pending",
        }));

        const formattedActivities = activities.map((a) => {
          // Tentative d'extraction du montant depuis le message via Regex (ex: "converti 5000 FCFA")
          // Adaptez la regex selon le format de vos messages dans activity.js
          const amountMatch = a.message.match(/(\d+(?:\.\d+)?)/);
          const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

          let title = "Opération diverse";
          let direction = "in"; // Par défaut entrée
          let currency = "FCFA";

          if (a.type === "conversion") {
            title = "Conversion de fonds";
            currency = "Pts"; // On a reçu des points
          } else if (a.type === "withdrawal") {
            title = "Demande de retrait";
            direction = "out";
            currency = "FCFA";
          } else if (a.type === "payment_received") {
            title = "Paiement mission reçu";
          }

          return {
            id: `act-${a.id}`,
            originalId: a.id,
            date: a.createdAt,
            type: a.type,
            title: title,
            description: a.message,
            amount: amount,
            currency: currency,
            direction: direction,
            status: a.status, // 'success', 'pending', etc.
          };
        });

        // 3. Fusion et Tri global
        const combinedHistory = [
          ...formattedEnrollments,
          ...formattedActivities,
        ];

        // Tri du plus récent au plus ancien
        combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Pagination finale sur la liste fusionnée
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = combinedHistory.slice(startIndex, endIndex);

        res.json({
          success: true,
          history: paginatedData,
          pagination: {
            totalItems: combinedHistory.length,
            currentPage: page,
            totalPages: Math.ceil(combinedHistory.length / limit),
            limit,
          },
        });
      } catch (error) {
        logger.error("Erreur historique wallet:", error);
        res.status(500).json({
          success: false,
          error: "Impossible de récupérer l'historique.",
        });
      }
    }
  );
  return router;
};
