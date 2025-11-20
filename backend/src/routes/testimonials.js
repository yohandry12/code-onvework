const express = require("express");
// --- Imports adaptés pour Sequelize ---
const { Testimonial, User, CandidateProfile, ClientProfile } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { logger } = require("../utils/logger");

// On exporte une fonction qui prend `io` pour être cohérent avec les autres fichiers
module.exports = function (io) {
    const router = express.Router();

    // --- POST /api/testimonials : Soumettre un témoignage ---
    router.post(
        "/",
        authenticateToken,
        requireRole("candidate", "client"),
        async (req, res) => {
            try {
                const { content } = req.body;
                const authorId = req.user.id; // L'ID vient de req.user défini par authenticateToken

                // On vérifie si l'utilisateur a déjà posté
                const existingTestimonial = await Testimonial.findOne({ where: { authorId } });
                if (existingTestimonial) {
                    return res.status(400).json({ success: false, error: "Vous avez déjà soumis un témoignage." });
                }

                // On crée directement la nouvelle entrée
                await Testimonial.create({
                    authorId: authorId,
                    content: content,
                    // isApproved et isFeatured sont `false` par défaut dans le modèle
                });

                res.status(201).json({
                    success: true,
                    message: "Merci ! Votre témoignage a été soumis pour approbation.",
                });

            } catch (error) {
                logger.error("Erreur soumission témoignage:", error);
                res.status(500).json({ success: false, error: "Erreur lors de la soumission de votre témoignage." });
            }
        }
    );

    // --- GET /api/testimonials/featured : Obtenir les témoignages à afficher ---
    router.get("/featured", async (req, res) => {
        try {
            // C'est l'équivalent de `find({ isApproved: true, ... }).populate(...)`
            const testimonials = await Testimonial.findAll({
                where: {
                    isApproved: true,
                    isFeatured: true,
                },
                order: [['createdAt', 'DESC']],
                limit: 6,
                include: { // C'est ici qu'on fait la "jointure" (le populate)
                    model: User,
                    as: 'author', // L'alias défini dans models/index.js
                    attributes: ['id', 'role'], // On sélectionne les champs de User...
                    include: [ // ...et on imbrique une autre jointure pour le profil spécifique
                        {
                            model: CandidateProfile,
                            as: 'candidateProfile',
                            attributes: ['firstName', 'lastName', 'profession', 'avatar'],
                        },
                        {
                            model: ClientProfile,
                            as: 'clientProfile',
                            attributes: ['firstName', 'lastName', 'company']
                        }
                    ]
                }
            });

            // On formate la réponse pour qu'elle ressemble à l'ancienne structure
            const formattedTestimonials = testimonials.map(t => {
                const plain = t.get({ plain: true });
                if (plain.author) {
                    plain.author.profile = plain.author.candidateProfile || plain.author.clientProfile;
                    delete plain.author.candidateProfile;
                    delete plain.author.clientProfile;
                }
                return plain;
            });

            res.json({ success: true, testimonials: formattedTestimonials });
        } catch (error) {
            logger.error("Erreur récupération témoignages:", error);
            res.status(500).json({ success: false, error: "Erreur lors de la récupération des témoignages." });
        }
    });


    // --- GET /api/testimonials (pour l'admin) : Obtenir tous les témoignages ---
    router.get("/", authenticateToken, requireRole("admin"), async (req, res) => {
        try {
            const allTestimonials = await Testimonial.findAll({
                order: [['createdAt', 'DESC']],
                include: { // Jointure simple pour avoir le nom de l'auteur
                    model: User,
                    as: 'author',
                    attributes: ['id', 'email', 'role'],
                    include: [{ model: CandidateProfile, as: 'candidateProfile', attributes: ['firstName', 'lastName']}, {model: ClientProfile, as: 'clientProfile', attributes: ['firstName', 'lastName']}]
                }
            });

            const formattedTestimonials = allTestimonials.map(t => {
                const plain = t.get({ plain: true });
                if (plain.author) {
                    // On crée l'objet `profile` générique attendu par le frontend
                    plain.author.profile = plain.author.candidateProfile || plain.author.clientProfile;
                    
                    // On nettoie pour ne pas envoyer de données redondantes
                    delete plain.author.candidateProfile;
                    delete plain.author.clientProfile;
                }
                return plain;
            });
            res.json({ success: true, testimonials: formattedTestimonials });
        } catch (error) {
            logger.error("Erreur récupération tous les témoignages:", error);
            res.status(500).json({ success: false, error: "Erreur serveur" });
        }
    });

    // --- PATCH /api/testimonials/:id (pour l'admin) : Approuver/Mettre en avant ---
    router.patch(
        "/:id",
        authenticateToken,
        requireRole("admin"),
        async (req, res) => {
            try {
                const { id } = req.params;
                const { isApproved, isFeatured } = req.body;

                const testimonial = await Testimonial.findByPk(id);
                if (!testimonial) {
                    return res.status(404).json({ success: false, error: "Témoignage non trouvé." });
                }
                
                // On met à jour seulement les champs fournis dans la requête
                if (isApproved !== undefined) testimonial.isApproved = isApproved;
                if (isFeatured !== undefined) testimonial.isFeatured = isFeatured;
                
                await testimonial.save();
                
                res.json({ success: true, testimonial });

            } catch (error) {
                logger.error("Erreur mise à jour témoignage:", error);
                res.status(500).json({ success: false, error: "Erreur serveur." });
            }
        }
    );

    return router;
};