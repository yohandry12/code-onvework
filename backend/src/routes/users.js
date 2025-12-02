const express = require("express");
// --- CHANGEMENT D'IMPORTS ---
const {
  User,
  CandidateProfile,
  ClientProfile,
  Job,
  sequelize,
  Application,
} = require("../models"); // Importer tous les modèles nécessaires
const { Op } = require("sequelize"); // Importer les opérateurs Sequelize
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const { findMatchingJobs } = require("../services/aiMatchingService");
const { getCompletedJobsCount } = require("../utils/stats");

module.exports = function (io) {
  const router = express.Router();

  // --- GET /api/users/search - Recherche d'utilisateurs (traduit pour Sequelize) ---
  router.get("/search", async (req, res) => {
    try {
      const { query = "", role, page = 1, limit = 12 } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      const whereClause = {
        isActive: true,
        // La vérification `publicProfile` se fait au niveau du profil spécifique si nécessaire
      };

      if (role) {
        whereClause.role = role;
      }

      const includeOptions = [];
      const orConditions = [];

      // Construire la recherche textuelle
      if (query) {
        // For robust case-insensitive matching, lower both column and query
        const qLower = `%${String(query).toLowerCase()}%`;

        if (!role || role === "candidate") {
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
            required: !!role, // Si un rôle est spécifié, la jointure est obligatoire
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
        // Inclure les profils même sans requête textuelle pour récupérer les données complètes
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
        distinct: true, // Important avec les `include` pour un décompte correct
        limit: limitNum,
        offset: offset,
        order: [["createdAt", "DESC"]],
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

  return router;
};
