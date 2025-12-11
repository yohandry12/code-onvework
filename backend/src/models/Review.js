// --- models/Review.js ---
const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Review extends Model {}

  Review.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
        comment: "L'étudiant qui note",
      },
      trainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "training_id",
      },
      trainerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "trainer_id",
        comment: "Pour faciliter le calcul de la note du formateur",
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: { type: DataTypes.TEXT },
    },
    {
      sequelize,
      modelName: "Review",
      tableName: "training_reviews",
      timestamps: true,
      underscored: true,
    }
  );

  return Review;
};
