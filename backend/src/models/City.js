const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class City extends Model {}

  City.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      region: { type: DataTypes.STRING },
      department: { type: DataTypes.STRING },
    },
    {
      sequelize,
      modelName: "City",
      tableName: "cities",
      underscored: true,
      timestamps: true,
      indexes: [{ fields: ["name"] }, { fields: ["slug"] }],
    }
  );

  City.associate = function (models) {
    if (models.CandidateProfile) {
      City.hasMany(models.CandidateProfile, {
        foreignKey: "city_id",
        as: "candidates",
      });
    }
  };

  return City;
};
