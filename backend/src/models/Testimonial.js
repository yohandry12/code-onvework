const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    // 1. Définition de la classe du modèle
    class Testimonial extends Model {}

    // 2. Initialisation du modèle avec ses champs (colonnes de la table)
    Testimonial.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        // Le champ 'authorId' sera créé par l'association dans 'index.js'
        
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Un contenu est requis."
                },
                len: {
                    args: [20, 500],
                    msg: "Le témoignage doit contenir entre 20 et 500 caractères."
                }
            }
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            field: 'is_featured'
        },
        isApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            field: 'is_approved'
        }
    }, {
        sequelize,
        modelName: 'Testimonial',
        tableName: 'testimonials',
        timestamps: true,
        underscored: true,
        indexes: [
            // Index pour accélérer la recherche de témoignages par auteur
            {
                fields: ['author_id']
            }
        ]
    });
    
    // 3. Retourner le modèle initialisé
    return Testimonial;
};