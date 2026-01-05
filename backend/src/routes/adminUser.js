const express = require("express");
const {
  User,
  CandidateProfile,
  ClientProfile,
  TrainerProfile,
  Activity,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const router = express.Router();

// Middleware pour toutes les routes de ce fichier : Seul un admin peut y accéder
router.use(authenticateToken, requireRole("admin"));

// --- 1. GET /api/users : Récupérer la liste de tous les utilisateurs (avec pagination et filtres) ---
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      role = "",
      status = "",
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {};

    // Ajout des filtres
    if (role) whereClause.role = role;
    if (status) whereClause.isActive = status === "active";
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { "$candidateProfile.first_name$": { [Op.iLike]: `%${search}%` } },
        { "$clientProfile.first_name$": { [Op.iLike]: `%${search}%` } },
        { "$trainerProfile.first_name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "email", "role", "isActive", "createdAt", "lastLogin"],
      include: [
        {
          model: CandidateProfile,
          as: "candidateProfile",
          attributes: ["firstName", "lastName", "profession", "trainingPoints"],
        },
        {
          model: ClientProfile,
          as: "clientProfile",
          attributes: ["firstName", "lastName", "company"],
        },
        {
          model: TrainerProfile,
          as: "trainerProfile",
          attributes: ["firstName", "lastName", "specialties"],
        },
      ],
    });

    const formattedUsers = users.map((u) => {
      const user = u.get({ plain: true });
      // CORRECTION ICI : Fusionner le trainerProfile aussi
      user.profile =
        user.candidateProfile ||
        user.clientProfile ||
        user.trainerProfile ||
        {};

      delete user.candidateProfile;
      delete user.clientProfile;
      delete user.trainerProfile;
      return user;
    });

    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        totalResults: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
      },
    });
  } catch (error) {
    logger.error("Erreur liste des utilisateurs:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

router.post("/", async (req, res) => {
  let t;
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      company,
      profession,
      location,
      sector,
      specialties,
    } = req.body;

    // --- Validation des données ---
    if (!email || !password || !role || !firstName || !lastName) {
      return res
        .status(400)
        .json({ success: false, error: "Tous les champs sont requis." });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Le mot de passe doit faire au moins 8 caractères.",
      });
    }

    const t = await sequelize.transaction();

    // Créer l'utilisateur principal
    const newUser = await User.create(
      {
        email: email.toLowerCase(),
        password,
        role,
        isActive: true, // Un utilisateur créé par un admin est actif par défaut
        emailVerified: true, // On peut considérer son email comme vérifié
      },
      { transaction: t }
    );

    // Créer le profil associé en fonction du rôle
    if (role === "candidate") {
      await CandidateProfile.create(
        {
          userId: newUser.id,
          firstName,
          lastName,
          location,
          profession,
        },
        { transaction: t }
      );
    } else if (role === "client") {
      await ClientProfile.create(
        {
          userId: newUser.id,
          firstName,
          lastName,
          location,
          sector,
          company: company || "Non spécifiée",
        },
        { transaction: t }
      );
    } else if (role === "trainer") {
      // CORRECTION : Création du profil formateur
      await TrainerProfile.create(
        {
          userId: newUser.id,
          firstName,
          lastName,
          specialties: specialties || [], // Gérer le cas où c'est vide
        },
        { transaction: t }
      );
    }

    await t.commit();

    res
      .status(201)
      .json({ success: true, message: "Utilisateur créé avec succès." });
  } catch (error) {
    await t?.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        error: "Cette adresse email est déjà utilisée.",
      });
    }
    logger.error("Erreur création utilisateur (admin):", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// --- 2. PATCH /api/users/:id/status : Activer ou désactiver un utilisateur ---
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "Le statut 'isActive' doit être un booléen.",
      });
    }

    const user = await User.findByPk(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "Utilisateur introuvable." });

    // Sécurité : Interdire à l'admin de se désactiver lui-même
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Vous не pouvez pas modifier votre propre statut.",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `Utilisateur ${isActive ? "activé" : "désactivé"}.`,
    });
  } catch (error) {
    logger.error("Erreur statut changé des utilisateurs:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// --- 3. DELETE /api/users/:id : Supprimer un utilisateur (soft-delete est une meilleure pratique) ---
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "Utilisateur introuvable." });

    // On ne se supprime pas soi-même
    if (user.id === req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Vous ne pouvez pas vous supprimer vous-même.",
      });
    }

    // Utiliser la suppression en cascade de la BDD est mieux,
    // sinon il faut supprimer manuellement les profils, jobs, etc.
    await user.destroy();

    res.json({ success: true, message: "Utilisateur supprimé." });
  } catch (error) {
    logger.error("Erreur lors de la suppression des utilisateurs:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// --- GET /api/users/:id : Récupérer les détails d'un utilisateur spécifique ---
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ["id", "email", "role", "isActive", "createdAt", "lastLogin"],
      include: [
        {
          model: CandidateProfile,
          as: "candidateProfile",
          // Pas d'attributs spécifiques = tout récupérer (y compris trainingPoints)
        },
        {
          model: ClientProfile,
          as: "clientProfile",
        },
        { model: TrainerProfile, as: "trainerProfile" },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Utilisateur introuvable." });
    }

    // Formatter la réponse comme pour la liste, pour simplifier le front
    const formattedUser = user.get({ plain: true });

    // Fusion intelligente du profil
    formattedUser.profile =
      formattedUser.candidateProfile ||
      formattedUser.clientProfile ||
      formattedUser.trainerProfile ||
      {};

    // Si c'est un candidat, on s'assure que trainingPoints est accessible au bon niveau si besoin
    // Mais votre frontend semble le chercher dans user.profile.trainingPoints, ce qui est correct avec la fusion ci-dessus.

    delete formattedUser.candidateProfile;
    delete formattedUser.clientProfile;
    delete formattedUser.trainerProfile;

    res.json({ success: true, user: formattedUser });
  } catch (error) {
    logger.error("Erreur récupération détail utilisateur (admin):", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// --- PATCH /api/admin/users/:id/points - Modifier les points de formation (Candidat uniquement) ---
router.patch("/:id/points", async (req, res) => {
  // Démarrage de la transaction
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { points, action } = req.body; // action = 'add' ou 'remove'

    // 1. Validation des entrées
    const amount = parseInt(points, 10);
    if (isNaN(amount) || amount <= 0) {
      await t.rollback();
      return res.status(400).json({
        error: "Le montant des points doit être un nombre entier positif.",
      });
    }
    if (!["add", "remove"].includes(action)) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Action invalide (attendu: 'add' ou 'remove')." });
    }

    // 2. Récupération du candidat avec verrouillage (LOCK)
    // Le lock empêche une modification concurrente pendant cette transaction
    const user = await User.findByPk(id, {
      include: [{ model: CandidateProfile, as: "candidateProfile" }],
      transaction: t,
      lock: true,
    });

    if (!user || !user.candidateProfile) {
      await t.rollback();
      return res.status(404).json({ error: "Profil candidat introuvable." });
    }

    const profile = user.candidateProfile;
    let currentPoints = parseInt(profile.trainingPoints || 0, 10);
    let newPoints = currentPoints;

    // 3. Calcul du nouveau solde
    if (action === "add") {
      newPoints += amount;
    } else {
      // Vérification pour éviter un solde négatif
      if (currentPoints < amount) {
        await t.rollback();
        return res.status(400).json({
          error: `Solde insuffisant pour retirer ${amount} points. Solde actuel : ${currentPoints}.`,
        });
      }
      newPoints -= amount;
    }

    // 4. Mise à jour en base
    await profile.update({ trainingPoints: newPoints }, { transaction: t });

    // 5. Création de l'historique d'activité (Audit Trail)
    // C'est important pour que l'admin et l'utilisateur sachent pourquoi le solde a changé.
    const activityMessage =
      action === "add"
        ? `L'administrateur vous a crédité de ${amount} points de formation.`
        : `L'administrateur a débité ${amount} points de votre solde.`;

    await Activity.create(
      {
        userId: user.id, // L'activité est liée au candidat pour qu'il la voie
        type: "system", // Ou 'admin-action'
        message: activityMessage,
        referenceId: req.user.id, // On garde l'ID de l'admin comme référence
        referenceType: "admin_update",
        status: action === "add" ? "success" : "warning",
      },
      { transaction: t }
    );

    // 6. Validation de la transaction
    await t.commit();

    logger.info(
      `[ADMIN] ${req.user.email} a ${
        action === "add" ? "ajouté" : "retiré"
      } ${amount} points au candidat ${user.email} (ID: ${
        user.id
      }). Nouveau solde: ${newPoints}`
    );

    res.json({
      success: true,
      newPoints,
      message: `Opération réussie. Nouveau solde : ${newPoints} points.`,
    });
  } catch (error) {
    await t.rollback();
    logger.error("Erreur update points admin:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour des points." });
  }
});

module.exports = router;
