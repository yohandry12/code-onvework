// --- models/Training.js ---
const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Training extends Model {}

  Training.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      trainerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "trainer_id",
      },
      // --- A. Infos Générales ---
      title: { type: DataTypes.STRING, allowNull: false },
      subtitle: { type: DataTypes.STRING }, // Petite phrase d'accroche
      description: { type: DataTypes.TEXT }, // Description riche (HTML/Markdown)

      category: { type: DataTypes.STRING },
      subCategory: { type: DataTypes.STRING, field: "sub_category" },

      level: {
        type: DataTypes.ENUM(
          "Débutant",
          "Intermédiaire",
          "Avancé",
          "Tous niveaux"
        ),
        defaultValue: "Tous niveaux",
      },
      language: { type: DataTypes.STRING, defaultValue: "Français" },

      // Stockage structuré pour listes à puces (JSON array)
      objectives: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: "Ce que l'étudiant va apprendre",
      },
      prerequisites: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: "Pré-requis nécessaires",
      },

      thumbnail: { type: DataTypes.STRING }, // Image de couverture
      trailerUrl: { type: DataTypes.STRING, field: "trailer_url" }, // Vidéo de présentation

      // --- F. Gestion Prix & Paiement ---
      price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        field: "discount_price",
        comment: "Prix promo si applicable",
      },

      // --- Données calculées ---
      duration: {
        type: DataTypes.INTEGER,
        comment: "Durée totale estimée en minutes",
      },
      totalModules: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "total_modules",
      },
      totalLessons: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "total_lessons",
      },

      status: {
        type: DataTypes.ENUM("draft","pending", "published", "archived", "review", "rejected"),
        defaultValue: "draft",
      },

      // --- E. Certificat ---
      certificateEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "certificate_enabled",
      },

      // Stats
      averageRating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        field: "average_rating",
      },
      totalStudents: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "total_students",
      },
    },
    {
      sequelize,
      modelName: "Training",
      tableName: "trainings",
      timestamps: true,
      underscored: true,
    }
  );

  return Training;
};
