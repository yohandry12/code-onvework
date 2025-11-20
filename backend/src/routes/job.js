const express = require("express");
const {
  Job,
  User,
  Application,
  Activity,
  sequelize,
  CandidateProfile,
  ClientProfile,
  Recommendation,
} = require("../models");
const { Op } = require("sequelize");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const upload = require("../middleware/upload");

module.exports = function (io) {
  const router = express.Router();

  // --- GET /api/jobs - Recherche, filtrage et pagination ---
  router.get("/", async (req, res) => {
    try {
      const {
        search,
        category,
        experience,
        page = 1,
        limit = 10,
        minBudget,
        maxBudget,
      } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const whereClause = {
        [Op.or]: [
          { status: "published" },
          // { status: "in_progress" },
          { status: "filled", updatedAt: { [Op.gte]: oneMonthAgo } },
        ],
      };

      /* 1. Filtres simples */
      if (category) whereClause.category = { [Op.in]: category.split(",") };
      if (experience)
        whereClause.experience = { [Op.in]: experience.split(",") };

      /* 2. Budget */
      if (minBudget || maxBudget) {
        whereClause.budgetMin = { [Op.gte]: parseInt(minBudget || 0, 10) };
        whereClause.budgetMax = {
          [Op.lte]: parseInt(maxBudget || 9999999, 10),
        };
      }

      /* 3. Recherche texte (on ajoute UNIQUEMENT un Op.and si besoin) */
      if (search) {
        // Use LOWER() on columns and compare with lowercased query to ensure
        // case-insensitive search regardless of MySQL collation.
        const qLower = `%${String(search).toLowerCase()}%`;
        whereClause[Op.and] = [
          {
            [Op.or]: [
              // LOWER(Job.title) LIKE :qLower
              sequelize.where(
                sequelize.fn("LOWER", sequelize.col("Job.title")),
                { [Op.like]: qLower }
              ),
              // LOWER(Job.description) LIKE :qLower
              sequelize.where(
                sequelize.fn("LOWER", sequelize.col("Job.description")),
                { [Op.like]: qLower }
              ),
            ],
          },
        ];
      }

      const { count, rows } = await Job.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "client",
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
        limit: limitNum,
        offset: offset,
        order: [["createdAt", "DESC"]],
        distinct: true,
      });

      // Transformer le résultat pour simplifier la structure
      const jobs = rows.map((job) => {
        const plainJob = job.get({ plain: true });
        if (plainJob.client && plainJob.client.clientProfile) {
          plainJob.client = {
            id: plainJob.client.id,
            email: plainJob.client.email,
            ...plainJob.client.clientProfile,
          };
        }
        return plainJob;
      });

      res.json({
        success: true,
        jobs: jobs,
        pagination: {
          totalResults: count,
          totalPages: Math.ceil(count / limitNum),
          currentPage: pageNum,
        },
      });
    } catch (error) {
      logger.error("Erreur chargement jobs:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  // --- POST /api/jobs - Création d'une mission ---
  router.post(
    "/",
    authenticateToken,
    requireRole("client", "admin"),
    async (req, res) => {
      try {
        const {
          title,
          description,
          budget,
          location,
          skills,
          experience,
          education,
          languages,
          clonedFromId,
          ...otherFields
        } = req.body;
        const clientUser = req.user;

        if (!title || !description || !budget?.min || !budget?.max) {
          return res
            .status(400)
            .json({ success: false, error: "Champs obligatoires manquants." });
        }

        // Récupérer le profil client pour avoir les infos complètes
        const clientProfile = await ClientProfile.findOne({
          where: { userId: clientUser.id },
        });

        const newJob = await Job.create({
          title,
          description,
          budgetMin: budget.min,
          budgetMax: budget.max,
          budgetCurrency: budget.currency,
          locationType: location.type,
          locationCity: location.city,
          locationCountry: location.country,

          // On assigne les champs "aplatis"
          skills,
          experience,
          education,
          languages,

          clientId: clientUser.id,
          // --- CORRECTION CLÉ : On utilise les champs de l'utilisateur de base (`req.user`) ---
          clientName: `${clientUser.firstName} ${clientUser.lastName}`,
          clientCompany: clientProfile?.company || null, // 'company' est spécifique au profil
          clonedFromId: clonedFromId || null,

          ...otherFields,
        });

        logger.info("Mission créée", {
          jobId: newJob.id,
          clientId: clientUser.id,
        });
        io.emit("new-job-posted", newJob);

        // Créer une activité pour le client
        try {
          const activity = await Activity.create({
            userId: clientUser.id,
            type: "job",
            message: `Vous avez publié une nouvelle mission : ${title}`,
            referenceId: newJob.id,
            referenceType: "job",
            status: "new",
          });
          io.to(`user-${clientUser.id}`).emit("activity", activity);
        } catch (err) {
          logger.warn(
            "Impossible de créer l'activité de publication :",
            err.message || err
          );
        }

        res.status(201).json({ success: true, job: newJob });
      } catch (error) {
        // Sécurité : éviter d'utiliser instanceof sur une valeur qui peut être undefined
        if (
          error &&
          (error.name === "SequelizeValidationError" ||
            error.name === "ValidationError" ||
            Array.isArray(error.errors))
        ) {
          const msg = Array.isArray(error.errors)
            ? error.errors.map((e) => e.message).join(", ")
            : error.message || "Erreur de validation";
          return res.status(400).json({ success: false, error: msg });
        }
        logger.error("Erreur création mission:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
      }
    }
  );

  // --- GET /api/jobs/my-jobs - Récupérer les jobs postés par le client (VERSION FIABLE) ---
  // router.get(
  //   "/my-jobs",
  //   authenticateToken,
  //   requireRole("client", "admin"),
  //   async (req, res) => {
  //     try {
  //       const clientId = req.user.id;
  //       const { page = 1, limit = 10, search, status } = req.query;

  //       const pageNum = parseInt(page, 10);
  //       const limitNum = parseInt(limit, 10);
  //       const offset = (pageNum - 1) * limitNum;

  //       // --- ÉTAPE 1 : Compter le nombre TOTAL de candidatures. C'est la source de vérité. ---
  //       // Cette requête est simple, rapide, et toujours juste.
  //       const totalApplications = await Application.count({
  //         where: { clientId },
  //       });

  //       // --- ÉTAPE 2 : On récupère la LISTE des jobs pour la pagination, sans se soucier du comptage. ---
  //       // Cette partie reste similaire à votre code.
  //       const jobs = await Job.findAll({
  //         where: { clientId: clientId },
  //         order: [["createdAt", "DESC"]],
  //         limit: limitNum,
  //         offset: offset,
  //         include: [
  //           {
  //             model: Application,
  //             as: "applications",
  //             include: {
  //               model: User,
  //               as: "candidate",
  //               include: { model: CandidateProfile, as: "candidateProfile" },
  //             },
  //           },
  //         ],
  //       });

  //       // --- ÉTAPE 3 (Facultatif mais propre) : On compte le nombre total de JOBS. ---
  //       const totalJobs = await Job.count({ where: { clientId } });

  //       // Votre logique de formatage est excellente, on la garde.
  //       const formattedJobs = jobs.map((job) => {
  //         const plainJob = job.get({ plain: true });
  //         plainJob.applications = (plainJob.applications || []).map((app) => {
  //           if (app.candidate && app.candidate.candidateProfile) {
  //             app.candidate = {
  //               id: app.candidate.id,
  //               email: app.candidate.email,
  //               role: app.candidate.role,
  //               ...app.candidate.candidateProfile,
  //             };
  //           }
  //           return app;
  //         });
  //         return plainJob;
  //       });

  //       res.json({
  //         success: true,
  //         jobs: formattedJobs,
  //         pagination: {
  //           // La pagination se base sur le nombre total de jobs
  //           currentPage: pageNum,
  //           totalPages: Math.ceil(totalJobs / limitNum),
  //           // IMPORTANT : On envoie le VRAI nombre d'applications ici !
  //           totalResults: totalApplications,
  //         },
  //       });
  //     } catch (error) {
  //       logger.error("Erreur récupération des missions du client:", error);
  //       res.status(500).json({ success: false, error: "Erreur serveur" });
  //     }
  //   }
  // );

  router.get(
    "/my-jobs",
    authenticateToken,
    requireRole("client", "admin"),
    async (req, res) => {
      try {
        const clientId = req.user.id;
        const { page = 1, limit = 10, search, status } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        // --- LOGIQUE DE FILTRAGE AMÉLIORÉE ---
        let jobWhereClause = { clientId };
        let applicationWhereClause = {};

        // Récupérer tous les job IDs du client pour le filtrage
        const allClientJobs = await Job.findAll({
          where: { clientId },
          attributes: ["id"],
          raw: true,
        });
        const allClientJobIds = allClientJobs.map((job) => job.id);

        let relevantJobIds = allClientJobIds;

        if (status && status !== "all") {
          if (status === "accepted") {
            // "En mission" : jobs NON terminés avec candidatures acceptées
            const jobsInProgress = await Job.findAll({
              where: {
                id: { [Op.in]: allClientJobIds },
                status: { [Op.ne]: "filled" },
              },
              attributes: ["id"],
              raw: true,
            });
            relevantJobIds = jobsInProgress.map((job) => job.id);
            applicationWhereClause.status = "accepted";
          } else if (status === "filled") {
            // "Terminée" : jobs terminés avec candidatures acceptées
            const filledJobs = await Job.findAll({
              where: {
                id: { [Op.in]: allClientJobIds },
                status: "filled",
              },
              attributes: ["id"],
              raw: true,
            });
            relevantJobIds = filledJobs.map((job) => job.id);
            applicationWhereClause.status = "accepted";
          } else {
            // "pending", "rejected"
            applicationWhereClause.status = status;
          }
        }

        // Support recherche texte pour la page "my-jobs" (titre/description du job et profil candidat)
        if (search) {
          const q = `%${search}%`;
          // filtrer les jobs dont le titre ou la description contient la recherche
          jobWhereClause[Op.and] = jobWhereClause[Op.and] || [];
          jobWhereClause[Op.and].push({
            [Op.or]: [
              { title: { [Op.like]: q } },
              { description: { [Op.like]: q } },
            ],
          });
        }
        // Filtrer les jobs par les IDs pertinents
        jobWhereClause.id = { [Op.in]: relevantJobIds };

        // --- ÉTAPE 1 : Compter le nombre TOTAL de candidatures filtrées ---
        const totalApplications = await Application.count({
          where: {
            clientId,
            jobId: { [Op.in]: relevantJobIds },
            ...applicationWhereClause,
          },
        });

        // --- ÉTAPE 2 : Récupérer les JOBS avec pagination ---
        // Préparer un where pour le candidateProfile si une recherche sur candidat est demandée
        let candidateProfileWhere = undefined;
        if (search) {
          const q = `%${search}%`;
          candidateProfileWhere = {
            [Op.or]: [
              { firstName: { [Op.like]: q } },
              { lastName: { [Op.like]: q } },
              { profession: { [Op.like]: q } },
            ],
          };
        }

        const jobs = await Job.findAll({
          where: jobWhereClause,
          order: [["createdAt", "DESC"]],
          limit: limitNum,
          offset: offset,
          include: [
            {
              model: Application,
              as: "applications",
              where: applicationWhereClause,
              required: Object.keys(applicationWhereClause).length > 0, // INNER JOIN si on filtre
              include: {
                model: User,
                as: "candidate",
                include: candidateProfileWhere
                  ? {
                      model: CandidateProfile,
                      as: "candidateProfile",
                      where: candidateProfileWhere,
                    }
                  : { model: CandidateProfile, as: "candidateProfile" },
              },
            },
          ],
        });

        // --- ÉTAPE 3 : Compter le nombre total de JOBS filtrés ---
        const totalJobs = await Job.count({
          where: jobWhereClause,
          distinct: true,
          include:
            Object.keys(applicationWhereClause).length > 0
              ? [
                  {
                    model: Application,
                    as: "applications",
                    where: applicationWhereClause,
                    attributes: [],
                  },
                ]
              : [],
        });

        // Formatage des résultats
        const formattedJobs = jobs.map((job) => {
          const plainJob = job.get({ plain: true });
          plainJob.applications = (plainJob.applications || []).map((app) => {
            if (app.candidate && app.candidate.candidateProfile) {
              app.candidate = {
                id: app.candidate.id,
                email: app.candidate.email,
                role: app.candidate.role,
                ...app.candidate.candidateProfile,
              };
            }
            return app;
          });
          return plainJob;
        });

        res.json({
          success: true,
          jobs: formattedJobs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalJobs / limitNum),
            totalResults: totalApplications,
          },
        });
      } catch (error) {
        logger.error("Erreur récupération des missions du client:", error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
      }
    }
  );

  // --- GET /api/jobs/:jobId - Détail d'une mission ---
  router.get("/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await Job.findByPk(jobId, {
        // La requête `include` est très bonne, on la garde.
        include: [
          {
            model: Application,
            as: "applications",
            include: {
              model: User,
              as: "candidate",
              attributes: ["id"], // On ne récupère que l'essentiel du User de base
              include: {
                model: CandidateProfile,
                as: "candidateProfile", // On récupère TOUT le profil du candidat
              },
            },
          },
          {
            model: User,
            as: "client",
            attributes: ["id"],
            include: {
              model: ClientProfile,
              as: "clientProfile",
            },
          },
        ],
      });

      if (!job) {
        return res
          .status(404)
          .json({ success: false, error: "Mission introuvable" });
      }

      // --- CORRECTION CRUCIALE : Transformer la réponse pour le frontend ---
      const plainJob = job.get({ plain: true });

      // 1. On fusionne le profil du client
      if (plainJob.client && plainJob.client.clientProfile) {
        // On remplace l'objet 'client' par un objet plus simple
        plainJob.client = {
          id: plainJob.client.id,
          // On copie toutes les propriétés du profil (company, firstName, etc.)
          ...plainJob.client.clientProfile,
        };
      }

      // 2. On fusionne le profil des candidats dans chaque application
      if (plainJob.applications) {
        plainJob.applications = plainJob.applications.map((app) => {
          if (app.candidate && app.candidate.candidateProfile) {
            app.candidate.profile = app.candidate.candidateProfile; // On crée la clé `profile` attendue
            delete app.candidate.candidateProfile;
          }
          return app;
        });
      }

      res.json({ success: true, job: plainJob });
    } catch (error) {
      logger.error("Erreur détail job:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  });

  router.get(
    "/:id/prepare-clone",
    authenticateToken,
    requireRole("client", "admin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const originalJob = await Job.findByPk(id, {
          // On ne récupère que les champs utiles, pas les associations lourdes
          attributes: [
            "title",
            "description",
            "category",
            "type",
            "budgetMin",
            "budgetMax",
            "budgetCurrency",
            "locationType",
            "locationCity",
            "locationCountry",
            "experience",
            "education",
            "skills",
            "tags",
            "languages",
            "durationValue",
            "durationUnit",
            "isUrgent",
            "clientId",
          ],
        });

        if (!originalJob) {
          return res
            .status(404)
            .json({ success: false, error: "Mission originale non trouvée." });
        }

        // Sécurité : Vérifier que le client est bien le propriétaire de la mission à cloner
        if (originalJob.clientId !== req.user.id && req.user.role !== "admin") {
          return res.status(403).json({
            success: false,
            error: "Vous n'êtes pas autorisé à cloner cette mission.",
          });
        }

        // On construit un NOUVEL objet propre pour le formulaire
        const clonedJobData = {
          // On préfixe directement le titre ici
          title: `Copie de : ${originalJob.title}`,
          description: originalJob.description,
          category: originalJob.category,
          type: originalJob.type,
          // Sequelize retourne des strings pour les décimaux, on les convertit si besoin
          budget: {
            min: parseFloat(originalJob.budgetMin) || "",
            max: parseFloat(originalJob.budgetMax) || "",
            currency: originalJob.budgetCurrency,
          },
          location: {
            type: originalJob.locationType,
            city: originalJob.locationCity,
            country: originalJob.locationCountry,
          },
          experience: originalJob.experience,
          education: originalJob.education,
          skills: originalJob.skills || [],
          tags: originalJob.tags || [],
          languages: originalJob.languages || [],
          durationValue: originalJob.durationValue,
          durationUnit: originalJob.durationUnit,
          isUrgent: originalJob.isUrgent,
          // On garde l'ID de l'original pour la traçabilité
          clonedFromId: id,
        };

        res.json({ success: true, job: clonedJobData });
      } catch (error) {
        logger.error("Erreur lors de la préparation du clonage:", error);
        res.status(500).json({ success: false, error: "Erreur serveur." });
      }
    }
  );

  // --- POST /api/jobs/:jobId/apply - Candidature à une mission (VERSION DÉFINITIVE) ---
  router.post(
    "/:jobId/apply",
    authenticateToken, // L'utilisateur doit être connecté
    requireRole("candidate"), // Seul un 'candidate' peut postuler

    // .any() accepte tous les champs (texte et fichiers) sans configuration complexe.
    // Si cela échoue, le problème est 100% lié au système de fichiers (chemin/permissions).
    upload.any(),

    async (req, res) => {
      // Démarrer une transaction Sequelize pour assurer l'atomicité
      const t = await sequelize.transaction();

      try {
        console.log("[Route /apply] Traitement de la requête démarré.");
        const { jobId } = req.params;
        const { coverLetter } = req.body;
        // TRADUCTION: req.user._id (Mongoose) devient req.user.id (Sequelize)
        const candidateId = req.user.id;

        // Étape 1 : Vérifier que la mission existe et qu'elle est ouverte
        // TRADUCTION: Job.findById(jobId) devient Job.findByPk(jobId)
        const job = await Job.findByPk(jobId, { transaction: t });
        if (!job) {
          await t.rollback(); // Annuler la transaction avant de répondre
          return res
            .status(404)
            .json({ success: false, error: "Mission introuvable" });
        }
        if (job.status !== "published") {
          await t.rollback();
          return res.status(400).json({
            success: false,
            error: "Cette mission n'accepte plus de candidatures.",
          });
        }

        // Étape 2 : Vérifier si le candidat a déjà postulé
        // TRADUCTION: findOne({ job: jobId, candidate: candidateId }) devient findOne({ where: { ... } })
        const existingApplication = await Application.findOne({
          where: { jobId, candidateId },
        });
        if (existingApplication) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            error: "Vous avez déjà postulé à cette offre.",
          });
        }

        // Étape 3 : Traiter les pièces jointes (cette logique est identique)
        // Avec upload.any(), les fichiers sont directement dans req.files (un tableau)
        const attachments = (req.files || []).map((file) => ({
          path: file.path,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        }));

        await Application.create(
          {
            jobId,
            candidateId,
            clientId: job.clientId,
            coverLetter,
            attachments,
          },
          { transaction: t }
        );

        await job.increment("applicationCount", { by: 1, transaction: t });
        await t.commit();

        io.to(`user-${job.clientId}`).emit("new-application", {
          jobId,
          jobTitle: job.title,
        });

        // Créer une activité pour le candidat
        try {
          const actCandidate = await Activity.create({
            userId: candidateId,
            type: "application",
            message: `Vous avez postulé à la mission : ${job.title}`,
            referenceId: jobId,
            referenceType: "job",
            status: "pending",
          });
          io.to(`user-${candidateId}`).emit("activity", actCandidate);
        } catch (err) {
          logger.warn(
            "Impossible de créer l'activité candidat :",
            err.message || err
          );
        }

        // Créer une activité pour le client
        try {
          const actClient = await Activity.create({
            userId: job.clientId,
            type: "application",
            message: `Nouvelle candidature reçue pour la mission : ${job.title}`,
            referenceId: jobId,
            referenceType: "job",
            status: "new",
          });
          io.to(`user-${job.clientId}`).emit("activity", actClient);
        } catch (err) {
          logger.warn(
            "Impossible de créer l'activité client :",
            err.message || err
          );
        }

        console.log("[Route /apply] Candidature traitée avec succès.");
        res.status(201).json({
          success: true,
          message: "Candidature envoyée avec succès !",
        });
      } catch (error) {
        await t.rollback();
        logger.error("Erreur lors de la candidature:", error);
        res
          .status(500)
          .json({ success: false, error: "Une erreur interne est survenue." });
      }
    }
  );

  // --- GET /api/jobs/my-jobs/history - Récupère l'historique des missions terminées d'un client ---
  router.get(
    "/my-jobs/history",
    authenticateToken,
    requireRole("client"), // Seuls les clients peuvent accéder
    async (req, res) => {
      try {
        const clientId = req.user.id; // L'ID vient de l'utilisateur authentifié
        const { page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        // Le filtre pour la requête Sequelize (équivalent de votre `filter` Mongoose)
        const whereClause = {
          clientId: clientId,
          status: "filled", // On ne récupère que les missions terminées
        };

        // `findAndCountAll` est l'équivalent optimisé de `find()` + `countDocuments()`
        const { count, rows: jobs } = await Job.findAndCountAll({
          where: whereClause,
          order: [["updatedAt", "DESC"]], // Tri par date de mise à jour (Sequelize)
          limit: limitNum,
          offset: offset,
          // Équivalent de `.select()` : on ne choisit que les colonnes nécessaires
          attributes: [
            "id", // Toujours inclure l'id
            "title",
            "status",
            "createdAt",
            "updatedAt",
            "applicationCount",
            "budgetMin", // Budget est maintenant séparé en min/max/currency
            "budgetMax",
            "budgetCurrency",
          ],
        });

        const totalPages = Math.ceil(count / limitNum);

        res.json({
          success: true, // Bonne pratique d'inclure un statut de succès
          jobs,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: count, // Renommé `totalJobs` en `totalResults` pour la cohérence
          },
        });
      } catch (error) {
        logger.error("Erreur récupération historique des missions:", error);
        res.status(500).json({
          success: false,
          error: "Erreur lors de la récupération de votre historique",
        });
      }
    }
  );

  // =============================================================
  // --- PATCH /api/jobs/:id/status - Mise à jour du statut (Sequelize) ---
  // =============================================================
  router.patch(
    "/:id/status",
    authenticateToken,
    requireRole("client", "admin"), // Seuls le client propriétaire et l'admin peuvent changer le statut
    async (req, res) => {
      try {
        const { id } = req.params;
        let { status } = req.body; // `let` car la valeur peut être réassignée
        const currentUser = req.user;

        // 1. Normalisation du statut reçu du frontend (la logique est conservée)
        const aliasMap = {
          completed: "filled",
          done: "filled",
          finished: "filled",
        };
        if (aliasMap[status]) {
          status = aliasMap[status];
        }

        // 2. Trouver la mission
        const job = await Job.findByPk(id);
        if (!job) {
          return res
            .status(404)
            .json({ success: false, error: "Mission non trouvée." });
        }

        // 3. Vérification des permissions
        if (job.clientId !== currentUser.id && currentUser.role !== "admin") {
          return res
            .status(403)
            .json({ success: false, error: "Accès non autorisé." });
        }

        // 4. Mettre à jour uniquement le statut sans déclencher les autres validations
        await Job.update(
          { status },
          {
            where: { id },
            fields: ["status"], // Ne mettre à jour que le champ status
            validate: false, // Désactiver la validation complète du modèle
          }
        );

        // Récupérer la mission mise à jour
        const updatedJob = await Job.findByPk(id);

        logger.info("Statut de la mission mis à jour", {
          jobId: id,
          newStatus: status,
        });

        // Créer une activité selon le nouveau statut
        if (status === "filled") {
          try {
            const act = await Activity.create({
              userId: updatedJob.clientId,
              type: "job",
              message: `La mission "${updatedJob.title}" est maintenant terminée`,
              referenceId: id,
              referenceType: "job",
              status: "info",
            });
            io.to(`user-${updatedJob.clientId}`).emit("activity", act);
          } catch (err) {
            logger.warn(
              "Impossible de créer l'activité filled :",
              err.message || err
            );
          }
        } else if (status === "closed") {
          try {
            const act = await Activity.create({
              userId: updatedJob.clientId,
              type: "job",
              message: `La mission "${updatedJob.title}" a été fermée`,
              referenceId: id,
              referenceType: "job",
              status: "info",
            });
            io.to(`user-${updatedJob.clientId}`).emit("activity", act);
          } catch (err) {
            logger.warn(
              "Impossible de créer l'activité closed :",
              err.message || err
            );
          }
        }

        res.json({ success: true, job: updatedJob });
      } catch (error) {
        logger.error("Erreur mise à jour statut mission:", error);
        if (error.name === "SequelizeValidationError") {
          return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: "Erreur serveur." });
      }
    }
  );

  router.post(
    "/:jobId/recommend",
    authenticateToken,
    requireRole("client", "admin"),
    async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const { jobId } = req.params;
        const { employeeId, message } = req.body;
        const employerId = req.user.id;

        // 1. & 2. Vérifier job et permissions
        const job = await Job.findByPk(jobId, { transaction: t });
        if (!job)
          return res
            .status(404)
            .json({ success: false, error: "Mission introuvable." });
        if (job.clientId !== employerId)
          return res
            .status(403)
            .json({ success: false, error: "Action non autorisée." });

        // 3. Vérifier que l'employé a été accepté
        const application = await Application.findOne({
          where: { jobId, candidateId: employeeId, status: "accepted" },
          transaction: t,
        });
        if (!application)
          return res.status(400).json({
            success: false,
            error: "Ce candidat n'a pas été accepté.",
          });

        // 4. Créer la nouvelle recommandation dans sa propre table
        await Recommendation.create(
          {
            jobId: jobId,
            employeeId: employeeId,
            employerId: employerId,
            message,
          },
          { transaction: t }
        );

        // 5. Mettre à jour le badge (le comptage est maintenant ultra-rapide)
        const { count } = await Recommendation.findAndCountAll({
          where: { employeeId: employeeId },
          transaction: t,
        });

        let newBadge = "Bronze";
        if (count >= 15) newBadge = "Or";
        else if (count >= 5) newBadge = "Argent";

        await CandidateProfile.update(
          { recommendationBadge: newBadge },
          { where: { userId: employeeId }, transaction: t }
        );

        // La notification reste la même
        io.to(`user-${employeeId}`).emit("recommendation-received", {
          newBadge,
          employerName: job.clientName,
        });

        await t.commit();

        // Créer une activité pour l'employé
        try {
          const act = await Activity.create({
            userId: employeeId,
            type: "recommendation",
            message: `Vous avez reçu une recommandation et obtenu le badge ${newBadge}!`,
            referenceId: jobId,
            referenceType: "job",
            status: "new",
          });
          io.to(`user-${employeeId}`).emit("activity", act);
        } catch (err) {
          logger.warn(
            "Impossible de créer l'activité recommandation :",
            err.message || err
          );
        }

        res.status(201).json({
          success: true,
          message: "Recommandation enregistrée.",
          badge: newBadge,
        });
      } catch (error) {
        await t.rollback();
        logger.error("Erreur recommandation:", error);
        res.status(500).json({ success: false, error: "Erreur serveur." });
      }
    }
  );

  // router.get(
  //   "/my-jobs/history",
  //   authenticateToken,
  //   requireRole("client", "admin"),  // Ajout de admin pour cohérence
  //   async (req, res) => {
  //     try {
  //       const clientId = req.user.id;
  //       const { page = 1, limit = 10 } = req.query;
  //       const pageNumber = parseInt(page, 10);
  //       const limitNumber = parseInt(limit, 10);
  //       const offset = (pageNumber - 1) * limitNumber;

  //       // Filtre pour récupérer uniquement les missions terminées
  //       const whereClause = {
  //         clientId: clientId,
  //         status: "filled"  // Missions terminées uniquement
  //       };

  //       // Exécution en parallèle pour la performance
  //       const [result, totalJobs] = await Promise.all([
  //         Job.findAll({
  //           where: whereClause,
  //           order: [['updatedAt', 'DESC']], // Tri par date de fin
  //           offset: offset,
  //           limit: limitNumber,
  //           attributes: [
  //             'id',
  //             'title',
  //             'status',
  //             'createdAt',
  //             'updatedAt',
  //             'applicationCount',
  //             'budgetMin',
  //             'budgetMax',
  //             'budgetCurrency',
  //             // Optionnel : ajouter d'autres champs utiles
  //             'clientName',
  //             'clientCompany'
  //           ],
  //           raw: true  // Retourne des objets JS simples
  //         }),

  //         Job.count({
  //           where: whereClause
  //         })
  //       ]);

  //       // Transformation pour correspondre à la structure Mongoose
  //       const jobs = result.map(job => ({
  //         id: job.id,  // Ou _id si vous voulez garder la convention Mongo
  //         title: job.title,
  //         status: job.status,
  //         createdAt: job.createdAt,
  //         updatedAt: job.updatedAt,
  //         applicationCount: job.applicationCount,
  //         budget: {
  //           min: job.budgetMin,
  //           max: job.budgetMax,
  //           currency: job.budgetCurrency
  //         },
  //         // Données supplémentaires si nécessaire
  //         client: {
  //           name: job.clientName,
  //           company: job.clientCompany
  //         }
  //       }));

  //       const totalPages = Math.ceil(totalJobs / limitNumber);

  //       res.json({
  //         success: true,  // Ajout pour cohérence avec les autres routes
  //         jobs,
  //         pagination: {
  //           currentPage: pageNumber,
  //           totalPages,
  //           totalJobs,
  //         },
  //       });

  //     } catch (error) {
  //       logger.error("Erreur récupération historique des missions:", error);
  //       res.status(500).json({
  //         success: false,
  //         error: "Erreur lors de la récupération de votre historique",
  //       });
  //     }
  //   }
  // );

  return router;
};
