const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Application extends Model {}

  Application.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      // ====================================================================
      // --- CORRECTION CLÉ : DÉCLARER EXPLICITEMENT LES CLÉS ÉTRANGÈRES ---
      // On supprime le commentaire erroné et on ajoute les définitions.
      // ====================================================================
      jobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "job_id", // Respecte la convention 'underscored: true'
        references: {
          model: "jobs",
          key: "id",
        },
      },
      candidateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "candidate_id",
        references: {
          model: "users",
          key: "id",
        },
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "client_id",
        references: {
          model: "users", // La table des clients
          key: "id",
        },
      },
      // ====================================================================

      coverLetter: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "cover_letter",
        validate: {
          len: {
            args: [50, 2500],
            msg: "La lettre de motivation doit contenir entre 50 et 2500 caractères.",
          },
        },
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        // validate: {
        //   notEmptyArray(value) {
        //     if (!Array.isArray(value) || value.length === 0) {
        //       throw new Error(
        //         "Le champ attachments est obligatoire et doit contenir au moins un élément."
        //       );
        //     }
        //   },
        // },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "reviewed",
          "accepted",
          "rejected",
          "withdrawn",
          "completed_by_candidate",
          "completed",
          "filled",
          "proposal", // Client a proposé une mission (attente réponse candidat)
          "declined"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      // --- NOUVEAUX CHAMPS FINANCIERS ---
      amountTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "amount_total",
        comment: "Montant total de la mission (Budget)",
      },
      amountCandidate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "amount_candidate",
        comment: "70% : Gain net du candidat",
      },
      amountTraining: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "amount_training",
        comment: "20% : Fonds de formation",
      },
      amountPlatform: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "amount_platform",
        comment: "10% : Commission plateforme/employeur",
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "EUR",
      },

      clientNotes: {
        type: DataTypes.TEXT,
        field: "client_notes",
      },
      proposalMessage: {
        type: DataTypes.TEXT,
        field: "proposal_message",
      },
      history: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      withdrawnReason: {
        type: DataTypes.STRING,
        field: "withdrawn_reason",
      },
    },
    {
      sequelize,
      modelName: "Application",
      tableName: "applications",
      timestamps: true,
      underscored: true,
      indexes: [{ unique: true, fields: ["job_id", "candidate_id"] }],
      hooks: {
        beforeCreate: (application, options) => {
          application.history = [
            {
              event: "created",
              user: application.candidateId,
              details: "Candidature soumise.",
              timestamp: new Date(),
            },
          ];
        },
      },
    }
  );

  return Application;
};
