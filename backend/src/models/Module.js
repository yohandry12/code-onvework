// --- models/Module.js ---
const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Module extends Model {}

  Module.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      trainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "training_id",
      },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      orderIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "order_index",
      }, // Pour ordonner les modules (1, 2, 3...)
      duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // Durée cumulée des leçons du module
    },
    {
      sequelize,
      modelName: "Module",
      tableName: "training_modules",
      timestamps: true,
      underscored: true,
    }
  );

  return Module;
};
