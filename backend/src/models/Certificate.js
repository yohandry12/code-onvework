// --- models/Certificate.js ---
const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Certificate extends Model {}

  Certificate.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },

      trainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "training_id",
      },

      issuedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "issued_at",
      },

      verificationCode: {
        type: DataTypes.STRING,
        allowNull: false, // ← IMPORTANT (empêche NULL qui brise l'unicité)
        field: "verification_code",
      },

      pdfUrl: { type: DataTypes.STRING, field: "pdf_url" },
    },
    {
      sequelize,
      modelName: "Certificate",
      tableName: "certificates",
      timestamps: true,
      underscored: true,

      hooks: {
        beforeCreate: (certificate) => {
          certificate.verificationCode = `CERT-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`;
        },
      },
    }
  );

  return Certificate;
};
