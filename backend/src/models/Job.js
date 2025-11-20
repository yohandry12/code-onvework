const { DataTypes, Model } = require("sequelize");
const { Op } = require("sequelize");

module.exports = (sequelize) => {
  class Job extends Model {
    static associate(models) {
      // Un Job peut avoir plusieurs signalements (Reports).
      // C'est la partie "inverse" de la relation polymorphique.
      Job.hasMany(models.Report, {
        foreignKey: "contentId",
        constraints: false, // Important pour le polymorphisme
        scope: {
          contentType: "job", // Ne lier que les rapports dont le type est 'job'
        },
      });
    }
  }

  Job.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [10, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [50, 5000],
        },
      },
      category: {
        type: DataTypes.ENUM(
          "development",
          "design",
          "marketing",
          "writing",
          "consulting",
          "data",
          "mobile",
          "video",
          "translation",
          "other"
        ),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "freelance",
          "contrat",
          "à temps partiel",
          "temps plein"
        ),
        defaultValue: "freelance",
      },

      // --- "Aplatissement" des objets imbriqués ---
      budgetMin: {
        type: DataTypes.DECIMAL(10, 2),
        field: "budget_min",
        allowNull: false,
      },
      budgetMax: {
        type: DataTypes.DECIMAL(10, 2),
        field: "budget_max",
        allowNull: false,
      },
      budgetCurrency: {
        type: DataTypes.STRING(3),
        defaultValue: "EUR",
        field: "budget_currency",
      },

      locationType: {
        type: DataTypes.STRING,
        field: "location_type",
        defaultValue: "remote",
      },
      locationCity: { type: DataTypes.STRING, field: "location_city" },
      locationCountry: { type: DataTypes.STRING, field: "location_country" },

      experience: {
        type: DataTypes.ENUM("junior", "intermediate", "senior", "expert"),
        defaultValue: "intermediate",
      },
      education: { type: DataTypes.STRING },

      // --- Données du client (dénormalisées pour la performance) ---
      // La clé étrangère `clientId` sera gérée par les associations.
      clientName: {
        type: DataTypes.STRING,
        field: "client_name",
        allowNull: false,
      },
      clientCompany: { type: DataTypes.STRING, field: "client_company" },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "published",
          "paused",
          "closed",
          "filled",
          "interview",
          "reported",
          "in_progress"
        ),
        defaultValue: "pending",
      },
      isFrozen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_frozen",
        comment:
          "Si vrai, aucune action (candidature, etc.) ne peut être effectuée sur ce job.",
      },
      applicationCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "application_count",
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "view_count",
      },
      deadline: { type: DataTypes.DATE },
      startDate: { type: DataTypes.DATEONLY, field: "start_date" },
      //   duration: { type: DataTypes.STRING },
      durationValue: {
        type: DataTypes.INTEGER,
        field: "duration_value",
        comment: "Ex: 10, 3, 6. La quantité de temps.",
      },
      durationUnit: {
        type: DataTypes.ENUM("heures", "jours", "semaines", "mois", "projet"),
        field: "duration_unit",
        comment: "L'unité de temps (heures, jours, etc.)",
      },
      featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      isUrgent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_urgent",
      },
      clonedFromId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Une mission n'est pas toujours un clone
        field: "cloned_from_id",
        // La contrainte de clé étrangère sera définie dans index.js
      },

      // --- Relations via tables séparées ---
      skills: { type: DataTypes.JSON }, // On stocke sous forme de JSON, simple et efficace
      tags: { type: DataTypes.JSON },
      languages: { type: DataTypes.JSON },
    },
    {
      sequelize,
      modelName: "Job",
      tableName: "jobs",
      timestamps: true,
      underscored: true,

      hooks: {
        beforeValidate: (job) => {
          // Validation du budget (équivalent du pre-save middleware)
          if (job.budgetMax < job.budgetMin) {
            throw new Error(
              "Le budget maximum doit être supérieur ou égal au minimum"
            );
          }
        },
        beforeSave: (job) => {
          // Auto-génération des tags
          if (
            job.changed("title") ||
            job.changed("description") ||
            job.changed("skills")
          ) {
            const text = `${job.title} ${job.description} ${(
              job.skills || []
            ).join(" ")}`.toLowerCase();
            const autoTags = [];
            const techKeywords = {
              react: ["react"],
              nodejs: ["node"],
              javascript: ["js"],
              python: ["python"],
            };

            Object.keys(techKeywords).forEach((tag) => {
              if (techKeywords[tag].some((keyword) => text.includes(keyword))) {
                autoTags.push(tag);
              }
            });

            // Fusionner les tags sans doublons
            const currentTags = Array.isArray(job.tags) ? job.tags : [];
            job.tags = [...new Set([...currentTags, ...autoTags])];
          }
        },
      },

      // --- "Virtuals" Sequelize ---
      getterMethods: {
        url() {
          return `/jobs/${this.id}`;
        },
        isActive() {
          return (
            this.status === "published" &&
            (!this.deadline || this.deadline > new Date())
          );
        },
        timeRemaining() {
          const now = new Date();
          let endDate = null;

          // CAS 1 : On privilégie toujours la deadline si elle existe
          if (this.deadline) {
            endDate = new Date(this.deadline);
          }
          // CAS 2 : Pas de deadline, on calcule à partir de la durée
          else if (
            this.startDate &&
            this.durationValue &&
            this.durationUnit &&
            this.durationUnit !== "projet"
          ) {
            const startDate = new Date(this.startDate);
            endDate = new Date(startDate); // On part de la date de début

            switch (this.durationUnit) {
              case "heures":
                endDate.setHours(startDate.getHours() + this.durationValue);
                break;
              case "jours":
                endDate.setDate(startDate.getDate() + this.durationValue);
                break;
              case "semaines":
                endDate.setDate(startDate.getDate() + this.durationValue * 7);
                break;
              case "mois":
                endDate.setMonth(startDate.getMonth() + this.durationValue);
                break;
            }
          }

          // Si on n'a aucune date de fin, on ne peut rien calculer
          if (!endDate || endDate < now) {
            return null; // ou "Expiré", "Non applicable", etc.
          }

          // Calcul de la différence
          const diffMs = endDate - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

          if (diffDays > 1) {
            return `Expire dans ${diffDays} jours`;
          } else if (diffHours > 1) {
            return `Expire dans ${diffHours} heures`;
          } else {
            return `Expire bientôt`;
          }
        },
      },
    }
  );

  return Job;
};
