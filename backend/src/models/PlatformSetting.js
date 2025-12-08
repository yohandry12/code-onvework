const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class PlatformSetting extends Model {}

  PlatformSetting.init(
    {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.FLOAT, // On stocke 70, 20, 10
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "PlatformSetting",
      tableName: "platform_settings",
      timestamps: false, // Pas besoin de dates pour ça
    }
  );

  return PlatformSetting;
};
