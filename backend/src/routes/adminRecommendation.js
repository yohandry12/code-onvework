const express = require("express");
const {
  Recommendation,
  User,
  Job,
  CandidateProfile,
  ClientProfile,
} = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const router = express.Router();

// Middleware pour sécuriser toutes les routes de ce fichier
router.use(authenticateToken, requireRole("admin"));

// GET /api/recommendations/admin - Récupérer toutes les recommandations pour l'admin
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: recommendations } =
      await Recommendation.findAndCountAll({
        limit: limitNum,
        offset: offset,
        order: [["createdAt", "DESC"]],
        include: [
          // 1. Inclure les détails de la mission
          {
            model: Job,
            as: "job",
            attributes: ["id", "title"],
          },
          // 2. Inclure l'employeur (le client)
          {
            model: User,
            as: "employer",
            attributes: ["id"],
            include: {
              model: ClientProfile,
              as: "clientProfile",
              attributes: ["firstName", "lastName", "company"],
            },
          },
          // 3. Inclure l'employé (le candidat)
          {
            model: User,
            as: "employee",
            attributes: ["id"],
            include: {
              model: CandidateProfile,
              as: "candidateProfile",
              attributes: ["firstName", "lastName", "recommendationBadge"],
            },
          },
        ],
      });

    // Formatter la réponse pour la rendre simple à utiliser côté frontend
    const formattedRecs = recommendations.map((rec) => {
      const plain = rec.get({ plain: true });
      return {
        id: plain.id,
        message: plain.message,
        createdAt: plain.createdAt,
        job: plain.job,
        employer: {
          ...plain.employer?.clientProfile,
          id: plain.employer?.id,
        },
        employee: {
          ...plain.employee?.candidateProfile,
          id: plain.employee?.id,
        },
      };
    });

    res.json({
      success: true,
      recommendations: formattedRecs,
      pagination: {
        totalResults: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
      },
    });
  } catch (error) {
    logger.error("Erreur récupération recommandations admin:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;