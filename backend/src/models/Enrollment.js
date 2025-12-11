// --- models/Enrollment.js ---
const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Enrollment extends Model {}

  Enrollment.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // C'est ici qu'on précise que c'est un CANDIDAT
      candidateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "candidate_id",
        comment: "Référence l'ID user. Doit avoir le rôle 'candidate'.",
      },

      trainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "training_id",
      },

      // --- C. Progression ---
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // Pourcentage 0-100
        validate: { min: 0, max: 100 },
      },
      lastAccessedAt: {
        type: DataTypes.DATE,
        field: "last_accessed_at",
        defaultValue: DataTypes.NOW,
      },
      completedAt: {
        type: DataTypes.DATE,
        field: "completed_at",
      },

      // --- F. Gestion Paiement ---
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "refunded", "free"),
        defaultValue: "pending",
        field: "payment_status",
      },
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        field: "amount_paid",
        defaultValue: 0,
      },
      transactionId: {
        // ID Stripe, PayPal ou Mobile Money
        type: DataTypes.STRING,
        field: "transaction_id",
      },
    },
    {
      sequelize,
      modelName: "Enrollment",
      tableName: "enrollments",
      timestamps: true,
      underscored: true,
    }
  );

  return Enrollment;
};
