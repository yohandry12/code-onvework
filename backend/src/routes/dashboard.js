const express = require("express");
const {
  Job,
  User,
  Application,
  Training,
  Enrollment,
  TrainerProfile,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");

module.exports = function (io) {
  const router = express.Router();

  router.get("/stats", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      let stats = {};

      // --- LOGIQUE POUR LE CANDIDAT ---
      if (req.user.role === "candidate") {
        // 1. On récupère les comptes par statut directement
        const appStats = await Application.findAll({
          where: { candidateId: userId },
          attributes: [
            "status",
            [sequelize.fn("COUNT", sequelize.col("status")), "count"],
          ],
          group: ["status"],
          raw: true,
        });

        // 2. On transforme le tableau en objet { status: count }
        // Ex: { pending: 2, accepted: 1, completed: 5 }
        const statsMap = appStats.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count, 10);
          return acc;
        }, {});

        // 3. On récupère les vues du profil
        const profileData = await req.user.getCandidateProfile({
          attributes: ["profileViewCount"],
        });

        // 4. CALCULS PRÉCIS
        // Pending = En attente
        const pending = statsMap.pending || 0;

        // Active = "En mission" (accepted) + "En attente de validation" (completed_by_candidate)
        const active =
          (statsMap.accepted || 0) + (statsMap.completed_by_candidate || 0);

        // Completed = "Terminée" (completed ou filled)
        const completed = (statsMap.completed || 0) + (statsMap.filled || 0);

        // Total = Somme de tout (y compris rejected, withdrawn, etc.)
        const total = Object.values(statsMap).reduce((a, b) => a + b, 0);

        stats = {
          totalApplications: total,
          pendingApplications: pending,
          acceptedApplications: active, // Affiche les missions en cours
          completedJobs: completed, // Affiche les missions terminées
          profileViews: profileData?.profileViewCount || 0,
          interviewsScheduled: statsMap.interviewed || 0,
        };
      }

      // --- LOGIQUE POUR LE CLIENT (Optimisée aussi) ---
      else if (req.user.role === "client") {
        // Stats des Jobs
        const jobStats = await Job.findOne({
          where: { clientId: userId },
          attributes: [
            [sequelize.fn("COUNT", sequelize.col("id")), "totalCreatedJobs"],
            [
              sequelize.literal(
                `SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END)`
              ),
              "activeJobs",
            ],
            [
              sequelize.literal(
                `SUM(CASE WHEN status = 'filled' THEN 1 ELSE 0 END)`
              ),
              "completedJobs",
            ],
          ],
          raw: true,
        });

        // Stats des Applications reçues
        const appStats = await Application.findAll({
          include: [
            {
              model: Job,
              as: "job",
              where: { clientId: userId },
              attributes: [],
            },
          ],
          attributes: [
            "status",
            [sequelize.fn("COUNT", sequelize.col("Application.id")), "count"],
          ],
          group: ["status"],
          raw: true,
        });

        const appStatsMap = appStats.reduce((acc, current) => {
          acc[current.status] = parseInt(current.count, 10);
          return acc;
        }, {});

        stats = {
          totalCreatedJobs: parseInt(jobStats?.totalCreatedJobs || 0),
          activeJobs: parseInt(jobStats?.activeJobs || 0),
          completedJobs: parseInt(jobStats?.completedJobs || 0),

          totalApplications: Object.values(appStatsMap).reduce(
            (a, b) => a + b,
            0
          ),
          pendingApplications: appStatsMap.pending || 0,

          // Embauches = En cours + À valider + Terminées
          hiredCandidates:
            (appStatsMap.accepted || 0) +
            (appStatsMap.completed_by_candidate || 0) +
            (appStatsMap.completed || 0),
        };
      }

      // --- LOGIQUE ADMIN ---
      else if (req.user.role === "admin") {
        const now = new Date();
        const firstDayCurrentMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );
        const firstDayLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

        const [
          totalUsers,
          totalJobs,
          totalApplications,
          usersThisMonth,
          usersLastMonth,
        ] = await Promise.all([
          User.count(),
          Job.count(),
          Application.count(),
          User.count({
            where: { createdAt: { [Op.gte]: firstDayCurrentMonth } },
          }),
          User.count({
            where: {
              createdAt: {
                [Op.gte]: firstDayLastMonth,
                [Op.lt]: firstDayCurrentMonth,
              },
            },
          }),
        ]);

        // Calcul du pourcentage de croissance
        let growth = 0;
        if (usersLastMonth > 0) {
          growth = ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;
        } else if (usersThisMonth > 0) {
          growth = 100; // Croissance infinie si on part de 0
        }

        stats = {
          totalUsers,
          totalJobs,
          totalApplications,
          activeUsers: totalUsers, // À affiner si besoin
          monthlyGrowth: parseFloat(growth.toFixed(1)),
        };
      } // --- LOGIQUE POUR LE FORMATEUR (NOUVEAU) ---
      else if (req.user.role === "trainer") {
        // 1. Récupérer les IDs de toutes les formations du formateur
        const trainerTrainings = await Training.findAll({
          where: { trainerId: userId },
          attributes: ["id"],
          raw: true,
        });
        const trainingIds = trainerTrainings.map((t) => t.id);

        // 2. Compter les formations actives (publiées)
        const activeCourses = await Training.count({
          where: {
            trainerId: userId,
            status: "published",
          },
        });

        // 3. Compter le total des étudiants (Inscriptions)
        let totalStudents = 0;
        let totalRevenue = 0;

        if (trainingIds.length > 0) {
          totalStudents = await Enrollment.count({
            where: { trainingId: { [Op.in]: trainingIds } },
          });

          // 4. Calculer le revenu total historique (Somme des amountPaid)
          // Note : Le walletBalance dans le profil est le solde *actuel*, ici on calcule le CA *total*
          const revenueResult = await Enrollment.sum("amountPaid", {
            where: { trainingId: { [Op.in]: trainingIds } },
          });
          totalRevenue = revenueResult || 0;
        }

        // 5. Calculer la note moyenne globale
        const avgResult = await Training.findAll({
          where: { trainerId: userId, status: "published" },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("average_rating")), "avgRating"],
          ],
          raw: true,
        });
        const averageRating = avgResult[0]?.avgRating
          ? parseFloat(avgResult[0].avgRating).toFixed(1)
          : 0;

        // 6. Récupérer les 3 formations les plus récentes pour l'affichage
        // On doit aussi récupérer le nombre d'étudiants pour CHAQUE cours
        let recentCourses = await Training.findAll({
          where: { trainerId: userId },
          limit: 3,
          order: [["createdAt", "DESC"]],
          raw: true, // On récupère des objets JS simples
        });

        // Enrichir les cours récents avec le nombre d'étudiants
        // (On fait une requête count par cours car le nombre est faible, c'est performant)
        recentCourses = await Promise.all(
          recentCourses.map(async (course) => {
            const studentCount = await Enrollment.count({
              where: { trainingId: course.id },
            });
            return {
              ...course,
              totalStudents: studentCount,
            };
          })
        );

        stats = {
          activeCourses,
          totalStudents,
          totalRevenue, // Chiffre d'affaire global
          averageRating,
          recentCourses, // Tableau des 3 derniers cours avec leurs stats
        };
      }

      res.json({ success: true, stats });
    } catch (error) {
      logger.error("Erreur chargement stats dashboard:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  return router;
};
