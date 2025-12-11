// --- models/Lesson.js ---
const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Lesson extends Model {}

  Lesson.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      moduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "module_id",
      },
      trainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "training_id",
      }, // Redondance utile pour les requêtes rapides

      title: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM("video", "text", "quiz", "pdf", "exercise"),
        defaultValue: "video",
      },

      // --- B. Contenu ---
      content: { type: DataTypes.TEXT }, // Pour le texte riche ou description
      videoUrl: { type: DataTypes.STRING, field: "video_url" }, // URL Cloudinary/YouTube
      duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // En minutes

      isFreePreview: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_free_preview",
      }, // Accessible sans payer ?
      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "order_index",
      },

      // --- D. Quiz / Exercice (Stockage simplifié JSON) ---
      // Pour un quiz complet, on peut faire une table séparée, mais JSON suffit souvent pour des QCM simples
      quizData: {
        type: DataTypes.JSON,
        field: "quiz_data",
        comment: "Structure: [{question: '?', options: ['A','B'], correct: 0}]",
      },

      // Fichiers attachés (PDF, zip...)
      resources: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: "Liste des URLs de fichiers à télécharger",
      },
    },
    {
      sequelize,
      modelName: "Lesson",
      tableName: "training_lessons",
      timestamps: true,
      underscored: true,
    }
  );

  return Lesson;
};
