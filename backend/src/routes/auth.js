const express = require("express");
const {
  User,
  CandidateProfile,
  ClientProfile,
  sequelize,
} = require("../models"); // Import de tous les modèles + l'instance sequelize
const { generateToken, authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const router = express.Router();

// --- FONCTION D'AMORÇAGE POUR L'ADMINISTRATEUR ---
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@onvework.com";
    // En SQL, on cherche juste dans la table `users`
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const adminUser = await User.create({
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || "adminpassword@25", // Le hook s'occupe du hash
        role: "admin",
      });
      // Pour l'instant, pas de profil admin détaillé
      logger.info("✅ Compte administrateur par défaut créé.");
    }
  } catch (error) {
    logger.error("❌ Erreur lors de la création du compte admin :", error);
  }
};
createDefaultAdmin();

// POST /api/auth/register - Inscription (avec Transactions Sequelize)
router.post("/register", async (req, res) => {
  const t = await sequelize.transaction(); // Démarrer une transaction
  try {
    const {
      email,
      password,
      role = "candidate",
      firstName,
      lastName,
      company,
      employerType,
      phone,
      location,
      sector,
      commercialName,
      associationName,
    } = req.body;

    // ... (Vos validations initiales pour email, password, etc. restent les mêmes)
    if (password.length < 8)
      throw new Error("Le mot de passe doit faire au moins 8 caractères.");

    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Cet email est déjà utilisé" });
    }

    // 1. Créer l'utilisateur de base
    const user = await User.create(
      {
        email: email.toLowerCase(),
        password, // Le hook de Sequelize s'occupe du hash
        role,
      },
      { transaction: t }
    );

    // 2. Créer le profil spécifique
    if (role === "candidate") {
      await CandidateProfile.create(
        {
          userId: user.id,
          firstName,
          lastName,
        },
        { transaction: t }
      );
    } else if (role === "client") {
      if (!employerType) throw new Error("Le type d'employeur est requis.");
      const companyName = company || commercialName || associationName;
      await ClientProfile.create(
        {
          userId: user.id,
          firstName,
          lastName,
          company: companyName,
          employerType,
          phone,
          location,
          sector,
        },
        { transaction: t }
      );
    }

    // Si tout va bien, on valide la transaction
    await t.commit();

    // 3. Préparer la réponse
    const fullUser = await User.findByPk(user.id, {
      include: role === "candidate" ? "candidateProfile" : "clientProfile",
    });

    const token = generateToken(user.id);

    // Mettre à jour lastLogin
    fullUser.lastLogin = new Date();
    await fullUser.save();

    logger.info("Nouvel utilisateur inscrit:", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      user: fullUser.getPublicProfile(),
      token,
    });
  } catch (error) {
    await t.rollback(); // En cas d'erreur, on annule tout
    logger.error("Erreur inscription:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login - Connexion (avec Scopes Sequelize)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email et mot de passe requis" });
    }

    // Utiliser le "scope" `withPassword` pour inclure le hash
    const user = await User.scope("withPassword").findOne({
      where: { email: String(email).toLowerCase(), isActive: true },
    });

    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, error: "Email ou mot de passe incorrect" });
    }

    // Recharger l'utilisateur SANS le mot de passe mais AVEC le profil associé
    const fullUser = await User.findByPk(user.id, {
      include:
        user.role === "candidate"
          ? "candidateProfile"
          : user.role === "client"
          ? "clientProfile"
          : undefined,
    });

    const token = generateToken(user.id);
    fullUser.lastLogin = new Date();
    await fullUser.save();

    logger.info("Utilisateur connecté:", {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Connexion réussie",
      user: fullUser.getPublicProfile(),
      token,
    });
  } catch (error) {
    logger.error("Erreur connexion:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email et mot de passe requis" });
    }

    // 1. Trouver l'utilisateur AVEC le mot de passe ET s'assurer que son rôle est 'admin'
    const adminUser = await User.scope("withPassword").findOne({
      where: {
        email: String(email).toLowerCase(),
        role: "admin",
        isActive: true,
      },
    });

    // 2. Vérifier si l'utilisateur existe et si le mot de passe est correct
    if (!adminUser || !(await adminUser.matchPassword(password))) {
      // On envoie un message d'erreur générique pour des raisons de sécurité
      return res.status(401).json({
        success: false,
        error: "Identifiants d'administrateur incorrects.",
      });
    }

    // 3. Si tout est bon, on génère le token et on prépare la réponse
    const token = generateToken(adminUser.id);
    adminUser.lastLogin = new Date();
    await adminUser.save();

    // On n'a pas besoin de recharger le profil car les admins n'ont pas de profil détaillé pour l'instant
    const publicAdminProfile = adminUser.getPublicProfile();

    logger.info("Administrateur connecté:", { userId: adminUser.id });

    res.json({
      success: true,
      message: "Connexion administrateur réussie",
      user: publicAdminProfile,
      token,
    });
  } catch (error) {
    logger.error("Erreur connexion admin:", error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// GET /api/auth/me - Profil utilisateur connecté (avec include Sequelize)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // req.user est l'instance de base. On doit la recharger avec son profil.
    const fullUser = await User.findByPk(req.user.id, {
      include:
        req.user.role === "candidate"
          ? "candidateProfile"
          : req.user.role === "client"
          ? "clientProfile"
          : undefined,
    });

    if (!fullUser) {
      return res
        .status(404)
        .json({ success: false, error: "Utilisateur non trouvé" });
    }

    res.json({ success: true, user: fullUser.getPublicProfile() });
  } catch (error) {
    logger.error("Erreur récupération profil:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// POST /api/auth/logout - Déconnexion
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Note: Avec JWT, la déconnexion côté serveur est optionnelle
    // Le token sera invalidé côté client

    logger.info("Utilisateur déconnecté:", {
      userId: req.user._id,
      email: req.user.email,
    });

    res.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    logger.error("Erreur déconnexion:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la déconnexion",
    });
  }
});

// PUT /api/auth/profile - Mise à jour du profil (avec Transactions)
// Dans auth.js - Route PUT /profile
router.put("/profile", authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = req.user;
    const { profile: profileUpdates } = req.body;

    // Si aucune donnée de profil n'est fournie, il n'y a rien à faire.
    if (!profileUpdates || typeof profileUpdates !== "object") {
      return res
        .status(400)
        .json({ success: false, error: "Données de profil invalides." });
    }

    let profileToUpdate;
    if (user.role === "candidate") {
      profileToUpdate = await user.getCandidateProfile({ transaction: t });
    } else if (user.role === "client") {
      profileToUpdate = await user.getClientProfile({ transaction: t });
    }

    // Si le profil n'existe pas encore, on doit le créer
    if (!profileToUpdate) {
      if (user.role === "candidate") {
        profileToUpdate = await CandidateProfile.create(
          { userId: user.id, ...profileUpdates },
          { transaction: t }
        );
      } else if (user.role === "client") {
        profileToUpdate = await ClientProfile.create(
          { userId: user.id, ...profileUpdates },
          { transaction: t }
        );
      }
    }
    // Si le profil existe déjà, on le met à jour
    else {
      // --- CORRECTION CLÉ : Parser et valider les champs JSON ---
      const cleanedUpdates = { ...profileUpdates };

      const jsonFields = ["location", "skills", "diplomas"];

      for (const field of jsonFields) {
        // Si le champ est présent dans la requête
        if (cleanedUpdates[field] !== undefined) {
          // Et si c'est une chaîne de caractères non vide
          if (
            typeof cleanedUpdates[field] === "string" &&
            cleanedUpdates[field].trim() !== ""
          ) {
            try {
              // On essaie de la parser en objet/tableau
              cleanedUpdates[field] = JSON.parse(cleanedUpdates[field]);
            } catch (e) {
              // Si le parsing échoue, on renvoie une erreur claire
              return res.status(400).json({
                success: false,
                error: `Le champ '${field}' n'est pas un JSON valide.`,
              });
            }
          }
          // Si ce n'est pas déjà un objet/tableau, on s'assure que c'est bien `null` ou un format valide
          else if (
            typeof cleanedUpdates[field] !== "object" &&
            cleanedUpdates[field] !== null
          ) {
            cleanedUpdates[field] = null; // Mettre à null si le format est incorrect (ex: un nombre simple)
          }
        }
      }

      // Appliquer les mises à jour nettoyées
      Object.assign(profileToUpdate, cleanedUpdates);
      await profileToUpdate.save({ transaction: t });
    }

    await t.commit();

    // Recharger l'utilisateur complet pour renvoyer les données à jour
    const fullUser = await User.findByPk(user.id, {
      include: user.role === "candidate" ? "candidateProfile" : "clientProfile",
    });

    res.json({
      success: true,
      user: fullUser.getPublicProfile(),
      message: "Profil mis à jour avec succès.",
    });
  } catch (error) {
    await t.rollback();
    logger.error("Erreur mise à jour profil:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(". "),
      });
    }
    res
      .status(500)
      .json({ success: false, error: "Erreur lors de la mise à jour." });
  }
});

// POST /api/auth/change-password - Changement de mot de passe
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Mot de passe actuel et nouveau mot de passe requis",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Le nouveau mot de passe doit contenir au moins 8 caractères",
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select("+password");

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Mot de passe actuel incorrect",
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    logger.info("Mot de passe changé:", { userId: user._id });

    res.json({
      success: true,
      message: "Mot de passe changé avec succès",
    });
  } catch (error) {
    logger.error("Erreur changement mot de passe:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du changement de mot de passe",
    });
  }
});

// --- DELETE /api/auth/delete-account : Supprimer son propre compte ---
router.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userToDelete = await User.findByPk(userId);

    if (!userToDelete) {
      return res
        .status(404)
        .json({ success: false, error: "Utilisateur non trouvé." });
    }

    // Grâce à `onDelete: 'CASCADE'` dans vos modèles, la suppression
    // de l'utilisateur entraînera la suppression en cascade de son profil,
    // de ses paramètres, etc. C'est très puissant.
    await userToDelete.destroy();

    logger.info(`Compte supprimé pour l'utilisateur: ${userId}`);

    res.json({
      success: true,
      message: "Votre compte a été supprimé avec succès.",
    });
  } catch (error) {
    logger.error("Erreur lors de la suppression du compte:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression du compte.",
    });
  }
});

module.exports = router;
