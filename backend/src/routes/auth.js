const express = require("express");
const {
  User,
  CandidateProfile,
  ClientProfile,
  TrainerProfile,
  City,
  sequelize,
} = require("../models"); // Import de tous les modèles + l'instance sequelize
const { generateToken, authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

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
      candidateType,
      firstName,
      lastName,
      company,
      employerType,
      phone,
      location,
      sector,
      commercialName,
      associationName,
      address,
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
          candidateType: candidateType || "freelance",
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
    } else if (role === "trainer") {
      // --- AJOUTER CE BLOC ---
      await TrainerProfile.create(
        {
          userId: user.id,
          firstName,
          lastName,
          phone,
          location,
          // On initialise les champs spécifiques vides ou avec des valeurs par défaut
          bio: "",
          specialties: [],
        },
        { transaction: t }
      );
    }

    // Si tout va bien, on valide la transaction
    await t.commit();

    // 3. Préparer la réponse
    const includeModel =
      role === "candidate"
        ? "candidateProfile"
        : role === "client"
        ? "clientProfile"
        : role === "trainer"
        ? "trainerProfile"
        : undefined;

    const fullUser = await User.findByPk(user.id, {
      include: includeModel,
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
          : user.role === "trainer"
          ? "trainerProfile"
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
          : req.user.role === "trainer"
          ? "trainerProfile"
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

// PUT /api/auth/profile - Mise à jour du profil
router.put("/profile", authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = req.user;
    const { profile: profileUpdates } = req.body;

    if (!profileUpdates || typeof profileUpdates !== "object") {
      return res
        .status(400)
        .json({ success: false, error: "Données de profil invalides." });
    }

    // --- LOGIQUE POUR RECUPERER LE CITY_ID ---
    // Si une ville est fournie dans le JSON location, on cherche son ID
    let cityIdToUpdate = null;

    // On gère le cas où location est une string JSON ou un objet
    let locationData = profileUpdates.location;
    if (typeof locationData === "string") {
      try {
        locationData = JSON.parse(locationData);
      } catch (e) {}
    }

    if (locationData && locationData.city) {
      const cityName = locationData.city.trim();
      // Recherche de la ville par son nom (insensible à la casse si possible)
      const city = await City.findOne({
        where: sequelize.where(
          sequelize.fn("LOWER", sequelize.col("name")),
          sequelize.fn("LOWER", cityName)
        ),
        transaction: t,
      });

      if (city) {
        cityIdToUpdate = city.id;
      }
    }
    // ------------------------------------------

    let profileToUpdate;
    let created = false;

    if (user.role === "candidate") {
      // On cherche ou on crée le profil
      [profileToUpdate, created] = await CandidateProfile.findOrCreate({
        where: { userId: user.id },
        defaults: { ...profileUpdates, cityId: cityIdToUpdate }, // On ajoute cityId à la création
        transaction: t,
      });
    } else if (user.role === "client") {
      [profileToUpdate, created] = await ClientProfile.findOrCreate({
        where: { userId: user.id },
        defaults: profileUpdates,
        transaction: t,
      });
    } else if (user.role === "trainer") {
      // --- AJOUTER CE BLOC ---
      [profileToUpdate, created] = await TrainerProfile.findOrCreate({
        where: { userId: user.id },
        defaults: profileUpdates,
        transaction: t,
      });
    }

    // Si le profil existait déjà, on le met à jour
    if (!created) {
      const cleanedUpdates = { ...profileUpdates };

      // Si c'est un candidat et qu'on a trouvé un ID de ville, on l'ajoute
      if (user.role === "candidate" && cityIdToUpdate) {
        cleanedUpdates.cityId = cityIdToUpdate;
      }

      // Gestion des champs JSON
      const jsonFields = [
        "location",
        "skills",
        "diplomas",
        "specialties",
        "certifications",
      ];
      for (const field of jsonFields) {
        if (cleanedUpdates[field] !== undefined) {
          if (
            typeof cleanedUpdates[field] === "string" &&
            cleanedUpdates[field].trim() !== ""
          ) {
            try {
              cleanedUpdates[field] = JSON.parse(cleanedUpdates[field]);
            } catch (e) {
              return res.status(400).json({
                success: false,
                error: `Le champ '${field}' n'est pas un JSON valide.`,
              });
            }
          } else if (
            typeof cleanedUpdates[field] !== "object" &&
            cleanedUpdates[field] !== null
          ) {
            cleanedUpdates[field] = null;
          }
        }
      }

      Object.assign(profileToUpdate, cleanedUpdates);
      await profileToUpdate.save({ transaction: t });
    }

    await t.commit();

    // Recharger l'utilisateur complet
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

// --- POST /api/auth/avatar : Upload de la photo de profil ---
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"), // Le nom du champ doit être 'avatar'
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Aucune image fournie." });
      }

      const userId = req.user.id;
      const role = req.user.role;

      // URL publique pour accéder à l'image (ex: /uploads/avatar-123.jpg)
      // Note: Votre index.js sert le dossier uploads sur la route /uploads
      const avatarUrl = `/avatar/${req.file.filename}`;

      let profile;

      // 1. Récupérer le profil selon le rôle
      if (role === "candidate") {
        profile = await CandidateProfile.findOne({
          where: { userId },
          transaction: t,
        });
      } else if (role === "client") {
        profile = await ClientProfile.findOne({
          where: { userId },
          transaction: t,
        });
      } else if (role === "trainer") {
        // --- AJOUTER CE BLOC ---
        profile = await TrainerProfile.findOne({
          where: { userId },
          transaction: t,
        });
      }

      if (!profile) {
        await t.rollback();
        // Nettoyage : supprimer le fichier qui vient d'être uploadé
        fs.unlink(req.file.path, () => {});
        return res
          .status(404)
          .json({ success: false, error: "Profil introuvable." });
      }

      // 2. Supprimer l'ancienne image du disque (si elle existe)
      if (profile.avatar) {
        try {
          // profile.avatar ressemble à "/uploads/ancien.jpg"
          // On doit construire le chemin système absolu
          // On retire le premier slash pour avoir "uploads/ancien.jpg"
          const relativePath = profile.avatar.startsWith("/")
            ? profile.avatar.substring(1)
            : profile.avatar;

          // process.cwd() pointe vers la racine du projet (comme dans votre upload.js)
          const oldPath = path.resolve(process.cwd(), relativePath);

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            logger.info(`Ancien avatar supprimé : ${oldPath}`);
          }
        } catch (err) {
          logger.warn(
            "Erreur non bloquante lors de la suppression de l'ancien avatar :",
            err.message
          );
        }
      }

      // 3. Mettre à jour la BDD
      profile.avatar = avatarUrl;
      await profile.save({ transaction: t });

      await t.commit();

      logger.info(`Avatar mis à jour pour l'utilisateur ${userId}`);

      res.json({
        success: true,
        message: "Photo de profil mise à jour.",
        avatar: avatarUrl, // On renvoie la nouvelle URL au frontend
      });
    } catch (error) {
      await t.rollback();
      // En cas d'erreur, supprimer le fichier uploadé
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      logger.error("Erreur upload avatar:", error);
      res
        .status(500)
        .json({ success: false, error: "Erreur lors de l'upload." });
    }
  }
);

module.exports = router;
