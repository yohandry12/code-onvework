const express = require("express");
const {
  CandidateProfile,
  User,
  Recommendation,
  Job,
  ClientProfile,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const router = express.Router();

// --- GET /api/candidates/recommendations ---
// Récupère les recommandations de TOUS les candidats avec pagination par candidat
router.get("/recommendations", async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Définir l'ordre de tri
    let recommendationOrder = [["createdAt", "DESC"]];
    if (sortBy === "rating") {
      recommendationOrder = [["rating", "DESC"]];
    } else if (sortBy === "recent") {
      recommendationOrder = [["createdAt", "DESC"]];
    }

    // 1. Récupérer TOUS les candidats avec leurs recommandations
    const candidates = await CandidateProfile.findAll({
      attributes: [
        "userId",
        "firstName",
        "lastName",
        "avatar",
        "recommendationBadge",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "email"],
        },
      ],
      order: [["firstName", "ASC"]],
      raw: false,
    });

    // 2. Pour chaque candidat, récupérer les recommandations avec pagination
    const candidatesWithRecommendations = await Promise.all(
      candidates.map(async (candidate) => {
        // Compter TOUTES les recommandations
        const totalRecommendations = await Recommendation.count({
          where: { employeeId: candidate.userId },
        });

        // Calculer la note moyenne
        const ratingResult = await Recommendation.findOne({
          attributes: [
            [sequelize.fn("AVG", sequelize.col("rating")), "averageRating"],
          ],
          where: { employeeId: candidate.userId },
          raw: true,
        });
        const averageRating = ratingResult?.averageRating
          ? parseFloat(ratingResult.averageRating).toFixed(1)
          : 0;

        // Récupérer les recommandations paginées
        const recommendations = await Recommendation.findAll({
          where: { employeeId: candidate.userId },
          attributes: [
            "id",
            "jobId",
            "employerId",
            "message",
            "rating",
            "createdAt",
          ],
          include: [
            {
              model: User,
              as: "employer",
              attributes: ["id", "email"],
              include: [
                {
                  model: ClientProfile,
                  as: "clientProfile",
                  attributes: ["firstName", "lastName", "company"],
                },
              ],
            },
          ],
          order: recommendationOrder,
          limit: limitNum,
          offset: offset,
          raw: false,
        });

        // Calculer le nombre total de pages
        const totalPages = Math.ceil(totalRecommendations / limitNum);

        return {
          candidateId: candidate.userId,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          avatarUrl: candidate.avatar || null,
          email: candidate.User?.email || null,
          totalRecommendations,
          averageRating: parseFloat(averageRating),
          badge: candidate.recommendationBadge || "Bronze",
          recommendations: recommendations.map((rec) => ({
            id: rec.id,
            jobId: rec.jobId,
            employerId: rec.employerId,
            employerName: rec.employer?.clientProfile
              ? `${rec.employer.clientProfile.firstName} ${rec.employer.clientProfile.lastName}`
              : "Anonyme",
            employerCompany: rec.employer?.clientProfile?.company || "N/A",
            message: rec.message,
            rating: rec.rating,
            createdAt: rec.createdAt,
          })),
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: totalRecommendations,
          },
        };
      })
    );

    // 3. Filtrer les candidats sans recommandations (optionnel)
    const candidatesWithRecs = candidatesWithRecommendations.filter(
      (c) => c.totalRecommendations > 0
    );

    res.json({
      success: true,
      data: candidatesWithRecs,
      summary: {
        totalCandidates: candidatesWithRecs.length,
        totalRecommendationsAcrossAll: candidatesWithRecs.reduce(
          (sum, c) => sum + c.totalRecommendations,
          0
        ),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération recommandations des candidats:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des recommandations",
    });
  }
});

// --- GET /api/candidates/:candidateId/recommendations ---
// Récupère les recommandations d'un candidat spécifique avec pagination
router.get("/:candidateId/recommendations", async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Définir l'ordre de tri
    let recommendationOrder = [["createdAt", "DESC"]];
    if (sortBy === "rating") {
      recommendationOrder = [["rating", "DESC"]];
    }

    // 1. Récupérer le candidat
    const candidate = await CandidateProfile.findOne({
      where: { userId: candidateId },
      attributes: [
        "userId",
        "firstName",
        "lastName",
        "avatar",
        "recommendationBadge",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "email"],
        },
      ],
      raw: false,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: "Candidat non trouvé",
      });
    }

    // 2. Compter TOUTES les recommandations du candidat
    const totalRecommendations = await Recommendation.count({
      where: { employeeId: candidateId },
    });

    // 3. Calculer la note moyenne
    const ratingResult = await Recommendation.findOne({
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "averageRating"],
      ],
      where: { employeeId: candidateId },
      raw: true,
    });
    const averageRating = ratingResult?.averageRating
      ? parseFloat(ratingResult.averageRating).toFixed(1)
      : 0;

    // 4. Récupérer les recommandations paginées
    const recommendations = await Recommendation.findAll({
      where: { employeeId: candidateId },
      attributes: [
        "id",
        "jobId",
        "employerId",
        "message",
        "rating",
        "createdAt",
      ],
      include: [
        {
          model: User,
          as: "employer",
          attributes: ["id", "email"],
          include: [
            {
              model: ClientProfile,
              as: "clientProfile",
              attributes: ["firstName", "lastName", "company"],
            },
          ],
        },
        {
          model: Job,
          as: "job",
          attributes: ["id", "title"],
        },
      ],
      order: recommendationOrder,
      limit: limitNum,
      offset: offset,
      raw: false,
    });

    // 5. Calculer le nombre total de pages
    const totalPages = Math.ceil(totalRecommendations / limitNum);

    // 6. Construire la réponse
    res.json({
      success: true,
      data: {
        candidateId: candidate.userId,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        avatarUrl: candidate.avatar || null,
        email: candidate.User?.email || null,
        totalRecommendations,
        averageRating: parseFloat(averageRating),
        badge: candidate.recommendationBadge || "Bronze",
        recommendations: recommendations.map((rec) => ({
          id: rec.id,
          jobId: rec.jobId,
          jobTitle: rec.job?.title || "Mission supprimée",
          employerId: rec.employerId,
          employerName: rec.employer?.clientProfile
            ? `${rec.employer.clientProfile.firstName} ${rec.employer.clientProfile.lastName}`
            : "Anonyme",
          employerCompany: rec.employer?.clientProfile?.company || "N/A",
          message: rec.message,
          rating: rec.rating,
          createdAt: rec.createdAt,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalResults: totalRecommendations,
        },
      },
    });
  } catch (error) {
    logger.error("Erreur récupération recommandations du candidat:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des recommandations",
    });
  }
});

module.exports = router;
