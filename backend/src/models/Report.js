const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    // 1. Définition de la classe du modèle
    class Report extends Model {
        /**
         * Méthode "magique" pour récupérer l'objet signalé (Job, User, etc.)
         * de manière dynamique, similaire au `refPath` de Mongoose.
         * Exemple d'utilisation :
         * const report = await Report.findByPk(1);
         * const content = await report.getContent(); // Retourne l'instance Job ou User
         */
        getContent(options) {
            if (!this.contentType) return Promise.resolve(null);
            const mixinMethodName = `get${this.contentType.charAt(0).toUpperCase()}${this.contentType.slice(1)}`;
            if (typeof this[mixinMethodName] !== 'function') return Promise.resolve(null);
            return this[mixinMethodName](options);
        }
    }

    // 2. Initialisation du modèle avec ses champs
    Report.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        // --- RELATION POLYMORPHIQUE ---
        // L'ID de l'objet signalé (un Job ID, un User ID, etc.)
        contentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'content_id'
        },
        // Le nom du modèle de l'objet signalé ('job', 'user')
        contentType: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'content_type'
        },
        
        reporterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'reporter_id',
            references: {
              model: 'users', // Assurez-vous que c'est le nom de votre table des utilisateurs
              key: 'id'
            }
        },
        
        reason: {
            type: DataTypes.ENUM(
                "Spam",
                "Contenu inapproprié",
                "Informations trompeuses",
                "Fraude / Arnaque",
                "Autre"
            ),
            allowNull: false,
            validate: {
                notEmpty: { msg: "La raison du signalement est requise." }
            }
        },
        comment: {
            type: DataTypes.TEXT,
            validate: {
                len: {
                    args: [0, 1000],
                    msg: "Le commentaire ne peut pas dépasser 1000 caractères."
                }
            }
        },
        status: {
            type: DataTypes.ENUM("pending", "reviewed", "resolved", "dismissed"),
            defaultValue: "pending",
            allowNull: false,
        }
    }, {
        sequelize,
        modelName: 'Report',
        tableName: 'reports',
        timestamps: true,
        underscored: true,
        indexes: [
            // Contrainte d'unicité: un utilisateur ne peut signaler un contenu qu'une seule fois.
            {
                unique: true,
                fields: ['reporter_id', 'content_id', 'content_type']
            },
            // Index pour retrouver rapidement tous les signalements liés à un contenu
            {
                fields: ['content_id', 'content_type']
            }
        ]
    });
    
    // 3. Retourner le modèle
    return Report;
};