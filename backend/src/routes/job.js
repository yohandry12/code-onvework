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
  City,
} = require("../models");
const { Op } = require("sequelize");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const upload = require("../middleware/upload");
const { sendJobProposalEmail } = require("../services/mailService");

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
        budget,
        minBudget,
        maxBudget,
        city,
        status,
      } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // --- CORRECTION DU FILTRAGE PAR STATUT ---
      const whereClause = {};

      // 1. Statut (Logique améliorée)
      if (status) {
        // Si un statut spécifique est demandé, on l'utilise
        whereClause.status = status;
      } else {
        // Sinon, comportement par défaut : Publié OU (Terminé ET récent)
        whereClause[Op.and] = [
          { status: { [Op.notIn]: ["archived", "in_progress"] } }, // Toujours exclure archivés
          {
            [Op.or]: [
              { status: "published" },
              // { status: "in_progress" }, // On peut vouloir voir les missions en cours par défaut aussi
              { status: "filled", updatedAt: { [Op.gte]: oneMonthAgo } },
            ],
          },
        ];
      }

      // ✅ ENSUITE on peut l'utiliser
      /* 1. Filtre par ville */
      if (city) {
        // Recherche insensible à la casse et partielle (ex: "doua" trouve "Douala")
        whereClause.locationCity = { [Op.like]: `%${city}%` };
      }

      /* 2. Filtres simples */
      if (category) whereClause.category = { [Op.in]: category.split(",") };
      if (experience)
        whereClause.experience = { [Op.in]: experience.split(",") };

      /* 3. Budget */
      if (minBudget || maxBudget) {
        // On cherche si le budget fixe est dans la fourchette demandée par le candidat
        const budgetFilter = {};
        if (minBudget) budgetFilter[Op.gte] = parseInt(minBudget);
        if (maxBudget) budgetFilter[Op.lte] = parseInt(maxBudget);

        whereClause.budget = budgetFilter;
      }

      /* 4. Recherche texte (on ajoute UNIQUEMENT un Op.and si besoin) */
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
          isLocationRestricted, // Récupération du champ de restriction
          targetClientId, // Récupération de l'ID du client cible (si Admin)
          ...otherFields
        } = req.body;

        const currentUser = req.user; // L'utilisateur connecté (Client ou Admin)

        // 1. Validation des champs obligatoires
        if (!title || !description || !budget?.amount || !budget?.currency) {
          return res
            .status(400)
            .json({ success: false, error: "Champs obligatoires manquants." });
        }

        // 2. Gestion de la Ville (CityId)
        let cityIdToSave = null;
        if (location && location.city) {
          const cityFound = await City.findOne({
            where: sequelize.where(
              sequelize.fn("LOWER", sequelize.col("name")),
              sequelize.fn("LOWER", location.city.trim())
            ),
          });
          if (cityFound) {
            cityIdToSave = cityFound.id;
          }
        }

        // 3. Détermination du Propriétaire de la mission (Owner)
        let ownerId = currentUser.id;
        let ownerName = `${currentUser.firstName} ${currentUser.lastName}`;
        let ownerCompany = null;
        let initialStatus = "pending"; // Par défaut, en attente de validation

        // CAS A : C'est un ADMIN qui crée pour un CLIENT
        if (currentUser.role === "admin" && targetClientId) {
          const targetUser = await User.findByPk(targetClientId, {
            include: [{ model: ClientProfile, as: "clientProfile" }],
          });

          if (!targetUser) {
            return res.status(404).json({
              success: false,
              error: "Le client sélectionné n'existe pas.",
            });
          }
          if (targetUser.role !== "client") {
            return res.status(400).json({
              success: false,
              error: "L'utilisateur cible n'est pas un client.",
            });
          }

          // On remplace les infos du créateur par celles du client cible
          ownerId = targetUser.id;
          ownerName = `${targetUser.firstName} ${targetUser.lastName}`;
          ownerCompany = targetUser.clientProfile?.company || null;
          initialStatus = "published"; // L'admin publie directement, pas besoin de validation
        }
        // CAS B : C'est un CLIENT qui crée pour lui-même
        else {
          const clientProfile = await ClientProfile.findOne({
            where: { userId: currentUser.id },
          });
          ownerCompany = clientProfile?.company || null;
          // Le statut reste "pending" (en attente de modération)
        }

        // 4. Création de la mission
        const newJob = await Job.create({
          title,
          description,
          budget: budget.amount,
          budgetCurrency: budget.currency,

          // Localisation
          locationType: location.type,
          locationCity: location.city,
          locationCountry: location.country,
          cityId: cityIdToSave,
          isLocationRestricted: isLocationRestricted || false, // Enregistrement de la restriction

          // Détails
          skills,
          experience,
          education,
          languages,

          // Propriétaire et Statut (Calculés à l'étape 3)
          clientId: ownerId,
          clientName: ownerName,
          clientCompany: ownerCompany,
          status: initialStatus,

          clonedFromId: clonedFromId || null,
          ...otherFields,
        });

        logger.info("Mission créée", {
          jobId: newJob.id,
          clientId: ownerId,
          createdBy: currentUser.role,
        });

        io.emit("new-job-posted", newJob);

        // 5. Créer une activité pour le propriétaire de la mission (Le Client)
        try {
          const activityMessage =
            currentUser.role === "admin"
              ? `Une nouvelle mission a été publiée pour vous par l'administrateur : ${title}`
              : `Vous avez publié une nouvelle mission : ${title}`;

          const activity = await Activity.create({
            userId: ownerId, // L'activité apparaît chez le client propriétaire
            type: "job",
            message: activityMessage,
            referenceId: newJob.id,
            referenceType: "job",
            status: "new",
          });

          io.to(`user-${ownerId}`).emit("activity", activity);
        } catch (err) {
          logger.warn(
            "Impossible de créer l'activité de publication :",
            err.message || err
          );
        }

        res.status(201).json({ success: true, job: newJob });
      } catch (error) {
        // Sécurité : Gestion des erreurs de validation Sequelize
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
          if (status === "published") {
            // Si on cherche les missions publiées, on filtre sur la table JOB
            jobWhereClause.status = "published";
            // On ne filtre PAS les applications, car une mission publiée peut avoir 0 candidature
          } else if (status === "accepted") {
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
            "budget",
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
          budget: parseFloat(originalJob.budget),
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
          clientId: originalJob.clientId,
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

        // --- DEBUT : VÉRIFICATION DE LA RESTRICTION GÉOGRAPHIQUE ---
        if (job.isLocationRestricted) {
          // On récupère le profil du candidat pour avoir sa ville
          const candidateProfile = await CandidateProfile.findOne({
            where: { userId: candidateId },
            attributes: ["location"], // On suppose que location est stocké en JSON { city: "...", country: "..." }
          });

          // Normalisation pour comparaison (minuscule, sans espace)
          const jobCity = (job.locationCity || "").trim().toLowerCase();

          // Gérer le cas où location est un objet JSON ou des champs séparés selon votre DB
          // Ici je suppose que c'est stocké dans un champ JSON 'location' comme vu précédemment
          const candidateCityRaw = candidateProfile?.location?.city || "";
          const candidateCity = candidateCityRaw.trim().toLowerCase();

          if (!candidateCity || !jobCity || jobCity !== candidateCity) {
            await t.rollback();
            return res.status(400).json({
              success: false,
              error:
                "Le recruteur recherche uniquement les candidats résidant dans la ville de la mission.",
            });
          }
        }
        // --- FIN VÉRIFICATION ---

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

        // --- AJOUTER CETTE VÉRIFICATION DE SÉCURITÉ ---
        if (attachments.length === 0) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            error: "Vous devez joindre un CV ou un fichier.",
          });
        }

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

  // --- GET /api/jobs/my-jobs/history - Récupère l'historique des missions terminées ou expirées d'un client ---
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

        // Récupérer toutes les missions pour calculer les expirées
        const allJobs = await Job.findAll({
          where: { clientId },
          attributes: [
            "id",
            "title",
            "status",
            "createdAt",
            "updatedAt",
            "applicationCount",
            "budget",
            "budgetCurrency",
            "durationValue",
            "durationUnit",
          ],
          order: [["updatedAt", "DESC"]],
          raw: true,
        });

        // Fonction pour vérifier si une mission a expiré
        const calculateJobStatus = (job) => {
          // Si statut est "filled", c'est terminé
          if (job.status === "filled") {
            return {
              status: "filled",
              displayStatus: "Terminée",
              isExpired: false,
            };
          }

          // Vérifier si la mission a expiré
          if (
            job.durationValue &&
            job.durationUnit &&
            job.durationUnit !== "projet"
          ) {
            const createdDate = new Date(job.createdAt);
            let expirationDate = new Date(createdDate);

            // Calculer la date d'expiration selon la durée
            switch (job.durationUnit) {
              case "heures":
                expirationDate.setHours(
                  createdDate.getHours() + job.durationValue
                );
                break;
              case "jours":
                expirationDate.setDate(
                  createdDate.getDate() + job.durationValue
                );
                break;
              case "semaines":
                expirationDate.setDate(
                  createdDate.getDate() + job.durationValue * 7
                );
                break;
              case "mois":
                expirationDate.setMonth(
                  createdDate.getMonth() + job.durationValue
                );
                break;
            }

            // Vérifier si la mission est expirée
            if (new Date() > expirationDate) {
              return {
                status: "expired",
                displayStatus: "Expirée",
                isExpired: true,
              };
            }
          }

          // Retourner null si ce n'est ni terminée ni expirée (pour filtrer)
          return null;
        };

        // Enrichir et filtrer : garder UNIQUEMENT terminées et expirées
        const filteredJobs = allJobs
          .map((job) => {
            const statusInfo = calculateJobStatus(job);
            if (!statusInfo) return null; // Filtrer les missions qui ne sont ni terminées ni expirées

            return {
              ...job,
              displayStatus: statusInfo.displayStatus,
              hasExpired: statusInfo.isExpired,
            };
          })
          .filter((job) => job !== null);

        // Appliquer la pagination sur les missions filtrées
        const paginatedJobs = filteredJobs.slice(offset, offset + limitNum);
        const totalResults = filteredJobs.length;
        const totalPages = Math.ceil(totalResults / limitNum);

        res.json({
          success: true,
          jobs: paginatedJobs,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults,
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
        const { employeeId, message, rating } = req.body;
        const employerId = req.user.id;

        // Validation de la note (1-5 étoiles)
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            error: "La note doit être un nombre entier entre 1 et 5.",
          });
        }

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
          where: { jobId, candidateId: employeeId },
          transaction: t,
        });
        const allowedStatuses = ["accepted", "completed", "filled"];
        if (!application || !allowedStatuses.includes(application.status))
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
            rating: parseInt(rating, 10),
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

        const employerDisplayName = job.clientCompany || "Un client";

        // La notification reste la même
        io.to(`user-${employeeId}`).emit("recommendation-received", {
          newBadge,
          employerName: job.employerDisplayName, // Pour compatibilité
          // Ajout des champs séparés pour éviter "undefined undefined"
          employerFirstName: req.user.employerDisplayName,
          employerLastName: req.user.employerDisplayName,
        });

        await t.commit();

        // Créer une activité pour l'employé
        try {
          const act = await Activity.create({
            userId: employeeId,
            type: "recommendation",
            message: `Vous avez reçu une recommandation de  ${employerDisplayName} et obtenu le badge ${newBadge}!`,
            employerName: employerDisplayName,
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

  // --- POST /api/jobs/:jobId/recruit/:candidateId ---
  router.post(
    "/:jobId/recruit/:candidateId",
    authenticateToken,
    requireRole("client", "admin"),
    async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const { jobId, candidateId } = req.params;
        const { message } = req.body;
        const clientId = req.user.id;

        // 1. Vérifications
        const job = await Job.findByPk(jobId, { transaction: t });
        if (!job) return res.status(404).json({ error: "Mission introuvable" });

        // Vérifier que le client est bien le propriétaire
        if (job.clientId !== clientId && req.user.role !== "admin") {
          return res.status(403).json({ error: "Non autorisé" });
        }

        if (job.status !== "published") {
          return res
            .status(400)
            .json({ error: "La mission doit être publiée pour recruter." });
        }

        // Vérifier doublon (si une candidature ou une offre existe déjà)
        const existingApp = await Application.findOne({
          where: { jobId, candidateId },
          transaction: t,
        });
        if (existingApp) {
          return res.status(400).json({
            error:
              "Une interaction existe déjà avec ce candidat pour cette mission.",
          });
        }

        // 2. Création de l'Application (Statut Proposal)
        const newApplication = await Application.create(
          {
            jobId,
            candidateId,
            clientId,
            status: "proposal", // <--- LE STATUT CLÉ
            proposalMessage: message || "Bonjour, votre profil m'intéresse.",
            coverLetter:
              "Proposition de mission envoyée directement par le client. En attente de la réponse du candidat pour démarrer la collaboration.", // Remplissage par défaut
          },
          { transaction: t }
        );

        // 3. Notifications
        const candidate = await User.findByPk(candidateId, {
          include: [{ model: CandidateProfile, as: "candidateProfile" }],
          transaction: t,
        }); // Assurez-vous d'inclure le profil

        // Email
        if (candidate) {
          // On récupère le prénom depuis candidateProfile
          const candidateName = candidate.candidateProfile
            ? candidate.candidateProfile.firstName
            : "Candidat";

          // Email
          await sendJobProposalEmail(
            candidate.email,
            candidateName,
            job.clientName,
            job.title,
            message
          );

          // Socket.io
          io.to(`user-${candidateId}`).emit("offer-received", {
            jobId,
            jobTitle: job.title,
            clientName: job.clientName,
          });
        }

        await t.commit();
        res.json({
          success: true,
          message: "Proposition envoyée avec succès !",
        });
      } catch (error) {
        await t.rollback();
        logger.error(error);
        res.status(500).json({ success: false, error: "Erreur serveur" });
      }
    }
  );

  return router;
};
