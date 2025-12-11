// --- models/Certificate.js ---
const { DataTypes, Model } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

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
        unique: true,
        field: "verification_code",
      },
      pdfUrl: { type: DataTypes.STRING, field: "pdf_url" }, // URL du PDF généré
    },
    {
      sequelize,
      modelName: "Certificate",
      tableName: "certificates",
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: (certificate) => {
          // Génère un code unique court (ex: TRAIN-X7Z9-1234)
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
