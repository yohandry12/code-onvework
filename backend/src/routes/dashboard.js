const express = require("express");
// --- CHANGEMENT D'IMPORTS ---
const { Job, User, Application, sequelize } = require("../models");
const { Op } = require("sequelize");
const { authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");

module.exports = function (io) {
  const router = express.Router();

  // --- GET /api/dashboard/stats (Traduit pour Sequelize) ---
  router.get("/stats", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id; // L'ID est un entier avec Sequelize
      let stats = {};

      // --- LOGIQUE POUR LE CANDIDAT ---
      if (req.user.role === "candidate") {

        const [
          appStatsByStatus,
          completedJobsCount,
          profileData
        ] = await Promise.all([
          // Requête 1: Compter les candidatures par statut
          Application.findAll({
            where: { candidateId: userId },
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
          }),

          // Requête 2: Compter les missions terminées
          Application.count({
              where: {
                  candidateId: userId,
                  status: 'accepted' // L'application a été acceptée
              },
              include: [{
                  model: Job,
                  as: 'job',
                  where: { status: 'filled' }, // Et le job est terminé
                  attributes: [] // On a pas besoin des attributs du job, juste de la jointure
              }]
          }),
          
          // Requête 3: Récupérer le nombre de vues du profil
          req.user.getCandidateProfile({ attributes: ['profileViewCount'] })
        ]);
        
        // Formater les stats des candidatures
        const statsMap = appStatsByStatus.reduce((acc, item) => {
          const plainItem = item.get({ plain: true }); // Convertir en objet simple
          acc[plainItem.status] = plainItem.count;
          return acc;
        }, {});
        
        stats = {
          totalApplications: Object.values(statsMap).reduce((s, c) => s + c, 0),
          pendingApplications: statsMap.pending || 0,
          acceptedApplications: statsMap.accepted || 0,
          interviewsScheduled: statsMap.interviewed || 0, // 'interviewed' vient de votre enum Application Mongoose
          profileViews: profileData?.profileViewCount || 0,
          completedJobs: completedJobsCount || 0
        };
      }

      // --- LOGIQUE POUR LE CLIENT ---
      else if (req.user.role === "client") {
        const [jobStats, applicationStats] = await Promise.all([
          
          Job.findOne({
              where: { clientId: userId },
              attributes: [
                  [sequelize.fn('COUNT', sequelize.col('id')), 'totalCreatedJobs'],
                  [sequelize.fn('SUM', sequelize.col('view_count')), 'totalJobViews'],
                  [sequelize.literal(`SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END)`), 'activeJobs'],
                  [sequelize.literal(`SUM(CASE WHEN status = 'filled' THEN 1 ELSE 0 END)`), 'completedJobs']
              ],
              raw: true
          }),

          // --- Requête 2: Stats sur les applications (CORRIGÉE) ---
          Application.findAll({
              attributes: [
                  'status',
                  // On spécifie explicitement la table pour COUNT : Application.id
                  [sequelize.fn('COUNT', sequelize.col('Application.id')), 'count']
              ],
              include: [{
                  model: Job,
                  as: 'job',
                  where: { clientId: userId },
                  attributes: [] // Ne pas inclure d'attributs, la jointure est pour le filtre
              }],
              group: ['status'],
              raw: true
          })
        ]);
        
        const appStatsMap = applicationStats.reduce((acc, current) => {
          acc[current.status] = current.count;
          return acc;
        }, {});
        
        stats = {
          totalCreatedJobs: parseInt(jobStats?.totalCreatedJobs || 0),
          activeJobs: parseInt(jobStats?.activeJobs || 0),
          completedJobs: parseInt(jobStats?.completedJobs || 0),
          jobViews: parseInt(jobStats?.totalJobViews || 0),
          totalApplications: Object.values(appStatsMap).reduce((s, c) => parseInt(c) + s, 0),
          pendingApplications: parseInt(appStatsMap.pending || 0),
          hiredCandidates: parseInt(appStatsMap.accepted || 0),
          interviewsScheduled: parseInt(appStatsMap.interviewed || 0)
        };
      }
      
      // --- LOGIQUE POUR L'ADMINISTRATEUR ---
      else if (req.user.role === 'admin') {
          const [totalUsers, totalJobs, totalApplications, activeUsers] = await Promise.all([
              User.count(),
              Job.count(),
              Application.count(),
              User.count({
                  where: {
                      lastLogin: {
                          [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
                      }
                  }
              })
          ]);
          stats = {
              totalUsers,
              totalJobs,
              totalApplications,
              activeUsers,
              monthlyGrowth: 15 // Valeur factice, à calculer
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