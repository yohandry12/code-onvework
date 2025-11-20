const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class UserSettings extends Model {}

  UserSettings.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: "user_id",
        references: {
          model: "users", // Nom de la table
          key: "id",
        },
        onDelete: "CASCADE",
      },
      theme: {
        type: DataTypes.ENUM("light", "dark", "auto"),
        defaultValue: "auto",
      },
      language: {
        type: DataTypes.STRING,
        defaultValue: "fr", // Langue par défaut
      },
      // --- Préférences de notifications ---
      notifications: {
        type: DataTypes.JSON,
        defaultValue: {
          email: {
            newMessages: true,
            jobUpdates: true,
            platformNews: false,
          },
          push: {
            newMessages: true,
            jobUpdates: false,
          },
        },
      },
      // --- Préférences de confidentialité ---
      privacy: {
        type: DataTypes.JSON,
        defaultValue: {
          showProfileInSearch: true,
          showContactInfo: "connections", // ex: 'all', 'connections', 'none'
        },
      },
    },
    {
      sequelize,
      modelName: "UserSettings",
      tableName: "user_settings",
      timestamps: true, // Pour savoir quand les paramètres ont été mis à jour
      underscored: true,
    }
  );

  return UserSettings;
};
