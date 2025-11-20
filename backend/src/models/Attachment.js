const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Attachment extends Model {}

    Attachment.init({
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        filename: { type: DataTypes.STRING, allowNull: false },       // Nom sur le disque (ex: 1678886400000-cv.pdf)
        originalName: { type: DataTypes.STRING, allowNull: false, field: 'original_name' }, // Nom original (ex: mon_cv_2024.pdf)
        path: { type: DataTypes.STRING, allowNull: false },           // Chemin sur le disque
        mimetype: { type: DataTypes.STRING, allowNull: false },
        size: { type: DataTypes.INTEGER, allowNull: false },
        // La clé étrangère `ownerId` sera ajoutée par l'association
    }, {
        sequelize,
        modelName: 'Attachment',
        tableName: 'attachments',
        timestamps: true,
        underscored: true
    });
    
    return Attachment;
};