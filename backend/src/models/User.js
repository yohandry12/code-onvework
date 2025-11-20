const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
  // --- 1. MODÈLE DE BASE ---
  class User extends Model {
    // Méthode d'instance pour vérifier le mot de passe
    async matchPassword(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    }

    // Méthode pour normaliser la sortie et correspondre à la structure Mongoose
    getPublicProfile() {
      const userObject = this.get({ plain: true });
      delete userObject.password;

      const profile =
        userObject.candidateProfile ||
        userObject.clientProfile ||
        userObject.adminProfile;
      if (profile) {
        userObject.profile = profile;
        delete userObject.candidateProfile;
        delete userObject.clientProfile;
        delete userObject.adminProfile;
      }
      return userObject;
    }

    static associate(models) {
      // Un User peut avoir plusieurs signalements reçus sur son profil.
      User.hasMany(models.Report, {
        foreignKey: "contentId",
        constraints: false, // Important pour le polymorphisme
        scope: {
          contentType: "user", // Ne lier que les rapports dont le type est 'user'
        },
        as: "reportsReceived", // alias pour cette relation
      });
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true a été déplacé dans l'option 'indexes' pour la clarté
        validate: { isEmail: { msg: "L'adresse email est invalide." } },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [8, 255] },
      },
      role: {
        type: DataTypes.ENUM("candidate", "client", "admin"),
        allowNull: false,
      },
      // --- Champs communs de gestion ---
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "email_verified",
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
        field: "email_verification_token",
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        field: "password_reset_token",
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        field: "password_reset_expires",
      },
      lastLogin: { type: DataTypes.DATE, field: "last_login" },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      underscored: true,
      // --- Centralisation des Index pour éviter les doublons et les erreurs ---
      indexes: [
        { unique: true, fields: ["email"], name: "users_email_unique_idx" },
        { fields: ["role"], name: "users_role_idx" },
      ],
      hooks: {
        beforeSave: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
      defaultScope: { attributes: { exclude: ["password"] } },
      scopes: { withPassword: { attributes: { include: ["password"] } } },
    }
  );

  // --- 2. MODÈLES "ENFANTS" POUR LES PROFILS ---

  class CandidateProfile extends Model {}
  CandidateProfile.init(
    {
      userId: { type: DataTypes.INTEGER, primaryKey: true, field: "user_id" },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "last_name",
      },
      profession: { type: DataTypes.STRING },
      age: { type: DataTypes.INTEGER },
      avatar: { type: DataTypes.STRING },
      phone: DataTypes.STRING,
      location: DataTypes.JSON,
      bio: DataTypes.TEXT,
      skills: { type: DataTypes.JSON, defaultValue: [] },
      website: {
        type: DataTypes.STRING,
        validate: {
          isUrlOrEmpty(value) {
            if (value && value.trim() !== "") {
              const urlPattern = /^https?:\/\/.+/;
              if (!urlPattern.test(value)) {
                throw new Error(
                  "Le site web doit être une URL valide (commençant par http:// ou https://)"
                );
              }
            }
          },
        },
      },
      diplomas: { type: DataTypes.JSON, defaultValue: [] },
      recommendationBadge: {
        type: DataTypes.STRING,
        field: "recommendation_badge",
      },
      profileViewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "profile_view_count",
      },
    },
    {
      sequelize,
      modelName: "CandidateProfile",
      tableName: "candidate_profiles",
      timestamps: false,
      underscored: true,
    }
  );

  class ClientProfile extends Model {}
  ClientProfile.init(
    {
      userId: { type: DataTypes.INTEGER, primaryKey: true, field: "user_id" },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "last_name",
      },
      company: { type: DataTypes.STRING },
      sector: { type: DataTypes.STRING },
      commercialName: { type: DataTypes.STRING, field: "commercial_name" },
      phone: DataTypes.STRING,
      location: DataTypes.JSON,
      website: {
        type: DataTypes.STRING,
        validate: {
          isUrlOrEmpty(value) {
            if (value && value.trim() !== "") {
              const urlPattern = /^https?:\/\/.+/;
              if (!urlPattern.test(value)) {
                throw new Error(
                  "Le site web doit être une URL valide (commençant par http:// ou https://)"
                );
              }
            }
          },
        },
      },
      avatar: { type: DataTypes.STRING, field: "avatar" },
      employerType: {
        type: DataTypes.ENUM(
          "Entreprise formelle",
          "Startup",
          "Particulier",
          "Association",
          "PME"
        ),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ClientProfile",
      tableName: "client_profiles",
      timestamps: false,
      underscored: true,
    }
  );

  class AdminProfile extends Model {}
  AdminProfile.init(
    {
      userId: { type: DataTypes.INTEGER, primaryKey: true, field: "user_id" },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "last_name",
      },
      phone: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "AdminProfile",
      tableName: "admin_profiles",
      timestamps: false,
      underscored: true,
    }
  );

  // --- 3. DÉFINITION DES RELATIONS ---

  // Un utilisateur a UN profil candidat
  User.hasOne(CandidateProfile, {
    foreignKey: "userId",
    as: "candidateProfile",
    onDelete: "CASCADE",
  });
  CandidateProfile.belongsTo(User, { foreignKey: "userId" });

  // Un utilisateur a UN profil client
  User.hasOne(ClientProfile, {
    foreignKey: "userId",
    as: "clientProfile",
    onDelete: "CASCADE",
  });
  ClientProfile.belongsTo(User, { foreignKey: "userId" });

  // Un utilisateur a UN profil admin
  User.hasOne(AdminProfile, {
    foreignKey: "userId",
    as: "adminProfile",
    onDelete: "CASCADE",
  });
  AdminProfile.belongsTo(User, { foreignKey: "userId" });

  // ⬇️ Exporter un seul objet pour l'importer facilement dans `models/index.js`
  return { User, CandidateProfile, ClientProfile, AdminProfile };
};
