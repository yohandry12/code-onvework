const express = require("express");
const {
  Report,
  Job,
  User,
  CandidateProfile,
  ClientProfile,
  sequelize,
} = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const router = express.Router();

// POST /api/reports - Créer un signalement
router.post("/", authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { contentId, contentType, reason, comment } = req.body;
    const reporterId = req.user.id;

    // Validation
    if (!contentId || !contentType || !reason) {
      return res.status(400).json({
        success: false,
        error: "Les champs contentId, contentType et reason sont requis",
      });
    }

    // Vérifier que le contenu existe
    let content;
    if (contentType === "job") {
      content = await Job.findByPk(contentId);
    } else if (contentType === "user") {
      content = await User.findByPk(contentId);
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        error: "Contenu introuvable",
      });
    }

    // Vérifier si l'utilisateur a déjà signalé ce contenu
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        contentId,
        contentType,
      },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà signalé ce contenu",
      });
    }

    // Créer le signalement
    const report = await Report.create(
      {
        reporterId,
        contentId,
        contentType,
        reason,
        comment: comment || null,
        status: "pending",
      },
      { transaction: t }
    );

    if (contentType === "job") {
      content.isFrozen = true;
      content.status = "reported";
      // On sauvegarde la modification du job DANS LA TRANSACTION
      await content.save({ transaction: t }); // 👈 On passe la transaction
      logger.info(`Job ${contentId} gelé suite au signalement ${report.id}.`);
    }

    await t.commit();

    logger.info(
      `Nouveau signalement créé: ${report.id} par user ${reporterId}`
    );

    res.status(201).json({
      success: true,
      message: "Signalement envoyé avec succès",
      report,
    });
  } catch (error) {
    await t.rollback();
    logger.error("Erreur création signalement:", error);

    // Gérer les erreurs de validation Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      });
    }

    // Gérer les erreurs d'unicité
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà signalé ce contenu",
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi du signalement",
    });
  }
});

// GET /api/reports - Récupérer tous les signalements (admin uniquement)
router.get("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { status: "pending" },
      order: [["createdAt", "DESC"]],
      include: [
        {
          // Qui a signalé ?
          model: User,
          as: "reporter",
          attributes: ["id", "email", "role"], // On récupère aussi le rôle
          // --- CORRECTION n°1 : Inclure les profils du rapporteur ---
          include: [
            {
              model: CandidateProfile,
              as: "candidateProfile",
              attributes: ["firstName", "lastName"],
            },
            {
              model: ClientProfile,
              as: "clientProfile",
              attributes: ["firstName", "lastName"],
            },
          ],
        },
      ],
    });

    // --- PEUPLER LE CONTENU POLYMORPHIQUE MANUELLEMENT ---
    const populatedReports = await Promise.all(
      reports.map(async (report) => {
        // --- CORRECTION n°2 : Inclure les profils pour le contenu signalé de type 'user' ---
        let contentOptions = {};
        if (report.contentType === "user") {
          contentOptions.include = ["candidateProfile", "clientProfile"];
        }

        const content = await report.getContent(contentOptions);
        const plainReport = report.get({ plain: true });

        // Formater le rapporteur (reporter)
        if (plainReport.reporter) {
          plainReport.reporter.profile =
            plainReport.reporter.candidateProfile ||
            plainReport.reporter.clientProfile;
          delete plainReport.reporter.candidateProfile;
          delete plainReport.reporter.clientProfile;
        }

        // Formater le contenu signalé (content)
        if (content) {
          const plainContent = content.get({ plain: true });
          if (report.contentType === "user") {
            plainContent.profile =
              plainContent.candidateProfile || plainContent.clientProfile;
            delete plainContent.candidateProfile;
            delete plainContent.clientProfile;
          }
          plainReport.content = plainContent;
        } else {
          plainReport.content = null; // S'assurer que 'content' est null si rien n'est trouvé
        }

        return plainReport;
      })
    );

    res.json({ success: true, reports: populatedReports });
  } catch (error) {
    logger.error("Erreur récupération des signalements:", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// PATCH /api/reports/:id - Mettre à jour le statut (admin uniquement)
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Statut invalide",
      });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Signalement introuvable",
      });
    }

    report.status = status;
    await report.save();

    logger.info(`Signalement ${id} mis à jour: ${status}`);

    res.json({
      success: true,
      message: "Statut mis à jour",
      report,
    });
  } catch (error) {
    logger.error("Erreur mise à jour signalement:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour",
    });
  }
});

module.exports = router;
