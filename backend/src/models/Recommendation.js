const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Recommendation extends Model {}

    Recommendation.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        // Les clés étrangères `jobId`, `employeeId`, `employerId` seront créées par les associations
        
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Le message de la recommandation ne peut pas être vide." }
            }
        },
        badge: {
            type: DataTypes.ENUM("Bronze", "Argent", "Or"),
            defaultValue: "Bronze",
        },
    }, {
        sequelize,
        modelName: 'Recommendation',
        tableName: 'recommendations',
        timestamps: true, // `createdAt` sera utilisé pour le tri
        underscored: true
    });

    return Recommendation;
};