const express = require("express");
// --- CHANGEMENT D'IMPORTS ---
const {
  Application,
  Job,
  User,
  ClientProfile,
  CandidateProfile,
  sequelize,
} = require("../models"); // Importer les modèles nécessaires
const { authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const activitiesRouter = require("./activities");
const {
  sendCandidateAcceptedEmail,
  sendMissionCompletedByCandidateEmail,
  sendMissionApprovedCandidateEmail,
  sendMissionApprovedClientEmail,
} = require("../services/mailService");

module.exports = function (io) {
  const router = express.Router();

  const activityCreator = activitiesRouter(io);

  // --- PUT /api/applications/:id/status (Traduit pour Sequelize) ---
  router.put("/:id/status", authenticateToken, async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;
      const clientUser = req.user; // Le client qui effectue l'action

      // 1. Trouver la candidature par sa clé primaire (ID)
      const application = await Application.findByPk(id);

      if (!application) {
        return res
          .status(404)
          .json({ success: false, error: "Candidature introuvable" });
      }

      // Optionnel mais recommandé: Vérifier que l'utilisateur a le droit de modifier cette candidature
      const job = await application.getJob(); // Méthode générée par Sequelize
      if (job.clientId !== clientUser.id) {
        return res
          .status(403)
          .json({ success: false, error: "Action non autorisée." });
      }

      // 2. Mettre à jour l'instance et sauvegarder
      application.status = status;

      // Ajouter un événement à l'historique de la candidature (équivalent du middleware Mongoose)
      const historyEntry = {
        event: "status_changed",
        user: clientUser.id,
        details: `Statut changé à '${status}'.`,
        timestamp: new Date(),
      };
      // Sequelize gère les champs JSON de manière transparente
      application.history = [...(application.history || []), historyEntry];

      await application.save({ transaction: t });

      // Si la candidature est acceptée, le job passe "en cours".
      if (status === "accepted") {
        job.status = "in_progress"; // Au lieu de "closed"
        await Job.update(
          { status: "in_progress" }, // Les champs à mettre à jour
          {
            where: { id: job.id }, // La condition pour trouver le bon job
            transaction: t, // On s'assure que c'est dans la même transaction
          }
        );

        logger.info(
          `Le Job ${job.id} est maintenant "en cours" car la candidature ${application.id} a été acceptée.`
        );
      }

      // Cas 2 : Client VALIDE la fin de mission -> Job passe "Terminé" (filled)
      else if (status === "completed") {
        // On vérifie que le freelance avait bien marqué comme terminé avant (optionnel mais conseillé)
        // if (application.status !== 'completed_by_candidate') ... (on peut être souple ici)

        await Job.update(
          { status: "filled" }, // C'est ICI que la mission se ferme officiellement
          { where: { id: job.id }, transaction: t }
        );

        logger.info(`Job ${job.id} passé en 'filled' (Terminé)`);
      }

      await t.commit();

      // --- ENVOI DES EMAILS SELON LE STATUT ---
      try {
        if (status === "accepted") {
          // Récupérer les infos du candidat et du job
          const candidate = await User.findByPk(application.candidateId, {
            include: [{ model: CandidateProfile, as: "profile" }],
          });

          if (candidate && candidate.email) {
            // Calculer la durée en format lisible
            const duration = job.durationValue
              ? `${job.durationValue} ${
                  job.durationUnit === "days"
                    ? "jour(s)"
                    : job.durationUnit === "weeks"
                    ? "semaine(s)"
                    : "mois"
                }`
              : "Durée non spécifiée";

            await sendCandidateAcceptedEmail(
              candidate.email,
              candidate.profile?.firstName || candidate.firstName || "Candidat",
              job.title,
              clientUser.profile?.firstName || clientUser.firstName || "Client",
              duration,
              job.createdAt // Utiliser la date de création comme date de début
            );
          }
        } else if (status === "completed") {
          // Envoyer les emails de validation de mission complétée
          const candidate = await User.findByPk(application.candidateId, {
            include: [{ model: CandidateProfile, as: "profile" }],
          });
          const client = await User.findByPk(job.clientId, {
            include: [{ model: ClientProfile, as: "profile" }],
          });

          // Email au candidat
          if (candidate && candidate.email) {
            await sendMissionApprovedCandidateEmail(
              candidate.email,
              candidate.profile?.firstName || candidate.firstName || "Candidat",
              job.title,
              client?.profile?.firstName || client?.firstName || "Client",
              new Date()
            );
          }

          // Email au client
          if (client && client.email) {
            await sendMissionApprovedClientEmail(
              client.email,
              client.profile?.firstName || client.firstName || "Client",
              candidate?.profile?.firstName ||
                candidate?.firstName ||
                "Candidat",
              job.title,
              new Date()
            );
          }
        }
      } catch (emailError) {
        logger.error("Erreur lors de l'envoi des emails:", emailError);
        // Ne pas bloquer la réponse si l'email échoue
      }

      // --- LOGIQUE DE NOTIFICATION (inchangée) ---
      const candidateId = application.candidateId.toString();
      const notificationData = {
        applicationId: application.id,
        status: application.status,
        jobTitle: job?.title || "une de vos offres",
        jobId: application.jobId,
        candidateId: candidateId,
      };

      // La room de Socket.IO utilise l'ID de l'utilisateur (qui est maintenant un entier)
      io.to(`user-${candidateId}`).emit(
        "application-updated",
        notificationData
      );

      let activityMessage = "";
      if (status === "accepted") {
        activityMessage = `🎉 Bonne nouvelle ! Votre candidature pour "${job.title}" a été acceptée.`;
      } else if (status === "rejected") {
        activityMessage = `Mise à jour : Votre candidature pour "${job.title}" a été refusée.`;
      }

      if (activityMessage) {
        await activityCreator.createActivity({
          userId: application.candidateId,
          type: "application_update",
          message: activityMessage,
          referenceId: application.id,
          referenceType: "application",
          status: "new",
        });
      }

      logger.info(
        `Statut de l'application ${application.id} mis à jour à '${status}' par ${clientUser.id}`
      );

      res.json({ success: true, application });
    } catch (err) {
      await t.rollback();
      logger.error("Erreur mise à jour statut candidature:", err);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // --- GET /api/applications/my (Traduit pour Sequelize) ---
  router.get("/my", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      const userApplications = await Application.findAll({
        where: { candidateId: userId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Job,
            as: "job",
            attributes: ["id", "title"],
            include: {
              model: User,
              as: "client",
              attributes: ["id"], // On a juste besoin de l'ID du user client pour la jointure
              // Jointure imbriquée sur le profil du client pour récupérer l'avatar
              include: {
                model: ClientProfile,
                as: "clientProfile",
                attributes: ["avatar", "company"],
              },
            },
          },
        ],
      });

      // --- Transformation pour simplifier les données pour le frontend ---
      const formattedApplications = userApplications.map((app) => {
        const plainApp = app.get({ plain: true });
        if (
          plainApp.job &&
          plainApp.job.client &&
          plainApp.job.client.clientProfile
        ) {
          plainApp.job.client.profile = plainApp.job.client.clientProfile;
          delete plainApp.job.client.clientProfile;
        }
        return plainApp;
      });

      res.json({ success: true, data: formattedApplications });
    } catch (error) {
      logger.error("Erreur récupération candidatures utilisateur:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  router.post("/:id/withdraw", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const candidateUser = req.user; // L'utilisateur authentifié est le candidat

      // 1. Trouver la candidature
      const application = await Application.findByPk(id);

      if (!application) {
        return res
          .status(404)
          .json({ success: false, error: "Candidature non trouvée." });
      }

      // 2. Vérification de sécurité : Seul le propriétaire de la candidature peut la retirer
      if (application.candidateId !== candidateUser.id) {
        return res.status(403).json({
          success: false,
          error:
            "Action non autorisée. Vous n'êtes pas le propriétaire de cette candidature.",
        });
      }

      // 3. Vérification de la logique métier : On ne peut pas retirer une candidature déjà traitée (refusée, etc.)
      const withdrawableStatuses = ["pending", "reviewed", "accepted"];
      if (!withdrawableStatuses.includes(application.status)) {
        return res.status(400).json({
          success: false,
          error: `Cette candidature a le statut '${application.status}' et ne peut plus être retirée.`,
        });
      }

      // 4. Mettre à jour les informations de la candidature
      application.status = "withdrawn";
      application.withdrawnReason = reason || "Pas de raison spécifiée.";

      // Ajouter une entrée à l'historique pour la traçabilité
      const historyEntry = {
        event: "withdrawn_by_candidate",
        user: candidateUser.id,
        details: `Candidature retirée. Raison : ${application.withdrawnReason}`,
        timestamp: new Date(),
      };
      application.history = [...(application.history || []), historyEntry];

      await application.save();

      // 5. (Optionnel mais recommandé) Notifier le client en temps réel
      const job = await application.getJob();
      if (job && job.clientId) {
        io.to(`user-${job.clientId}`).emit("application-withdrawn", {
          jobId: job.id,
          jobTitle: job.title,
          applicationId: application.id,
          candidateName: `${candidateUser.profile?.firstName || ""} ${
            candidateUser.profile?.lastName || ""
          }`.trim(),
        });
      }

      logger.info(
        `Candidature ${id} retirée par le candidat ${candidateUser.id}`
      );

      res.json({
        success: true,
        message: "Votre candidature a été retirée avec succès.",
      });
    } catch (err) {
      logger.error("Erreur lors du retrait de la candidature:", err);
      res.status(500).json({ success: false, error: "Erreur serveur." });
    }
  });

  // --- POST /api/applications/:id/mark-completed (Candidat marque la mission comme terminée) ---
  router.post("/:id/mark-completed", authenticateToken, async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const candidateUser = req.user;

      // 1. Trouver la candidature
      const application = await Application.findByPk(id);
      if (!application) {
        return res
          .status(404)
          .json({ success: false, error: "Candidature introuvable" });
      }

      const job = await application.getJob({ transaction: t });
      if (!job) {
        await t.rollback();
        return res
          .status(404)
          .json({ success: false, error: "Mission liée introuvable" });
      }

      // 2. Vérifier que c'est bien le candidat qui effectue l'action
      if (application.candidateId !== candidateUser.id) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          error: "Vous n'êtes pas autorisé à effectuer cette action.",
        });
      }

      // 3. Vérifier que la candidature est acceptée
      if (application.status !== "accepted") {
        return res.status(400).json({
          success: false,
          error:
            "Seules les missions acceptées peuvent être marquées comme terminées.",
        });
      }

      // 4. Mettre à jour le statut et ajouter la date de complétion par le candidat
      application.status = "completed_by_candidate";
      application.completedByCandidate_at = new Date();

      // Ajouter une entrée à l'historique
      const historyEntry = {
        event: "completed_by_candidate",
        user: candidateUser.id,
        details: "Le candidat a marqué la mission comme terminée.",
        timestamp: new Date(),
      };
      application.history = [...(application.history || []), historyEntry];

      await application.save({ transaction: t });
      await t.commit();

      // --- ENVOI D'EMAIL AU CLIENT ---
      try {
        const client = await User.findByPk(job.clientId, {
          include: [{ model: ClientProfile, as: "profile" }],
        });

        if (client && client.email) {
          await sendMissionCompletedByCandidateEmail(
            client.email,
            client.profile?.firstName || client.firstName || "Client",
            `${candidateUser.profile?.firstName || ""} ${
              candidateUser.profile?.lastName || ""
            }`.trim() || "Candidat",
            job.title,
            application.completedByCandidate_at
          );
        }
      } catch (emailError) {
        logger.error(
          "Erreur lors de l'envoi de l'email de fin de mission:",
          emailError
        );
        // Ne pas bloquer la réponse si l'email échoue
      }

      // 5. Notifier le client en temps réel via Socket.IO
      if (job && job.clientId) {
        io.to(`user-${job.clientId}`).emit("mission-completed-by-candidate", {
          jobId: job.id,
          jobTitle: job.title,
          applicationId: application.id,
          candidateName: `${candidateUser.profile?.firstName || ""} ${
            candidateUser.profile?.lastName || ""
          }`.trim(),
          completionDate: application.completedByCandidate_at,
        });
      }

      logger.info(
        `Candidat ${candidateUser.id} a marqué la mission ${application.id} comme terminée`
      );

      res.json({
        success: true,
        message:
          "Mission marquée comme terminée. En attente de la validation du client.",
        application,
      });
    } catch (err) {
      await t.rollback();
      logger.error(
        "Erreur lors du marquage de la mission comme terminée:",
        err
      );
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  return router;
};

// const express = require("express");
// // --- Imports adaptés pour Sequelize ---
// const { Application, Job, User, ClientProfile } = require("../models");
// const { authenticateToken, requireRole } = require("../middleware/auth");
// const { logger } = require("../utils/logger");

// module.exports = function (io) {
//   const router = express.Router();

//   // --- PUT /api/applications/:id/status (Traduit pour Sequelize) ---
//   router.put("/:id/status", authenticateToken, async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status } = req.body;
//       const currentUser = req.user; // La personne qui fait l'action

//       const allowedStatus = ['reviewed', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
//       if (!status || !allowedStatus.includes(status)) {
//         return res.status(400).json({ success: false, error: 'Statut invalide.' });
//       }

//       // 1. Trouver l'instance de la candidature
//       const application = await Application.findByPk(id);
//       if (!application) {
//         return res.status(404).json({ success: false, error: "Candidature introuvable." });
//       }

//       // 2. Vérification de sécurité: Seul le client propriétaire du job peut changer le statut
//       const job = await application.getJob(); // Méthode générée par Sequelize
//       if (currentUser.role !== 'admin' && job.clientId !== currentUser.id) {
//           return res.status(403).json({ success: false, error: "Action non autorisée."});
//       }

//       // 3. Mettre à jour l'instance et ajouter à l'historique (dans une transaction)
//       await application.sequelize.transaction(async (t) => {
//         application.status = status;
//         const historyEntry = {
//             event: 'status_changed',
//             user: currentUser.id,
//             details: `Statut changé à '${status}'.`,
//             timestamp: new Date()
//         };
//         application.history = [...(application.history || []), historyEntry];
//         await application.save({ transaction: t });
//       });

//       // --- Logique de Notification ---
//       const candidateId = application.candidateId.toString();
//       const notificationData = {
//         applicationId: application.id,
//         status: application.status,
//         jobTitle: job?.title || "une de vos missions",
//         candidateId: candidateId,
//       };

//       io.to(`user-${candidateId}`).emit("application-updated", notificationData);

//       logger.info(`Statut de l'application ${application.id} mis à jour à '${status}'`);

//       res.json({ success: true, application });

//     } catch (err) {
//       logger.error("Erreur mise à jour statut candidature:", err);
//       res.status(500).json({ success: false, error: "Erreur serveur." });
//     }
//   });

//   // --- GET /api/applications/my (Traduit pour Sequelize avec include imbriqué) ---
//   router.get("/my", authenticateToken, requireRole('candidate'), async (req, res) => {
//     try {
//       const userId = req.user.id;

//       // Traduction de .find({ candidate: userId }).populate(...)
//       const userApplications = await Application.findAll({
//         where: { candidateId: userId },
//         order: [['createdAt', 'DESC']],
//         include: [
//           {
//             model: Job,
//             as: 'job',
//             attributes: ['id', 'title'], // On ne récupère que le titre du job...
//             include: { // ...et on imbrique une jointure pour récupérer le client du job...
//               model: User,
//               as: 'client',
//               attributes: ['id'], // ...juste son ID de base...
//               include: { // ...pour enfin inclure le profil spécifique du client
//                 model: ClientProfile,
//                 as: 'clientProfile',
//                 attributes: ['company'] // On veut juste le nom de l'entreprise
//               }
//             }
//           }
//         ]
//       });

//       // Transformer les données pour qu'elles correspondent à ce que le frontend attendait de Mongoose
//       const formattedData = userApplications.map(app => {
//         const plainApp = app.get({ plain: true });
//         // Recréer la structure 'job.client.profile.company'
//         if (plainApp.job?.client?.clientProfile) {
//             plainApp.job.client.profile = { company: plainApp.job.client.clientProfile.company };
//             delete plainApp.job.client.clientProfile;
//         }
//         return plainApp;
//       });

//       res.json({ success: true, data: formattedData });
//     } catch (error) {
//       logger.error("Erreur récupération candidatures utilisateur:", error);
//       res.status(500).json({ success: false, error: "Erreur serveur." });
//     }
//   });

//   return router;
// };
