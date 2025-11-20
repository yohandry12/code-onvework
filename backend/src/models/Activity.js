const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Activity extends Model {}

  Activity.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "info",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "reference_id",
      },
      referenceType: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "reference_type",
      },
      status: {
        type: DataTypes.ENUM("pending", "new", "scheduled", "info"),
        defaultValue: "info",
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      meta: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Activity",
      tableName: "activities",
      underscored: true,
      timestamps: true,
    }
  );

  return Activity;
};
