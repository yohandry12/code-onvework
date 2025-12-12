// models/TrainerRating.js
module.exports = (sequelize, DataTypes) => {
  const TrainerRating = sequelize.define(
    "TrainerRating",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      trainer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "trainer_ratings",
      underscored: true,
    }
  );

  TrainerRating.associate = (models) => {
    TrainerRating.belongsTo(models.User, {
      foreignKey: "trainer_id",
      as: "trainer",
    });
    TrainerRating.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "author",
    });
  };

  return TrainerRating;
};
