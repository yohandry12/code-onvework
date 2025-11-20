const express = require("express");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { Attachment } = require("../models");
const { logger } = require("../utils/logger");

const router = express.Router();

// --- POST /api/files/upload - Pour téléverser un fichier ---
router.post('/upload', authenticateToken, upload.single('attachment'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "Aucun fichier fourni." });
        }

        // Le fichier a été sauvegardé sur le disque par Multer.
        // Maintenant, on enregistre ses informations en BDD.
        const fileData = req.file;

        const newAttachment = await Attachment.create({
            filename: fileData.filename,
            originalName: fileData.originalname,
            path: fileData.path,
            mimetype: fileData.mimetype,
            size: fileData.size,
            ownerId: req.user.id // Lier le fichier à l'utilisateur connecté
        });
        
        logger.info(`Fichier uploadé: ${fileData.filename} par user ${req.user.id}`);
        res.status(201).json({ success: true, file: newAttachment });

    } catch(error) {
        logger.error("Erreur d'upload:", error);
        res.status(500).json({ success: false, error: "Erreur serveur lors de l'upload."});
    }
});


// --- GET /api/files/:filename - Pour télécharger/servir un fichier ---
router.get("/:filename", authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 1. Vérifier en base de données si le fichier existe ET si l'utilisateur a le droit d'y accéder.
    const attachment = await Attachment.findOne({ where: { filename } });

    if (!attachment) {
        return res.status(404).json({ success: false, error: "Fichier non trouvé dans la base de données." });
    }

    // --- LOGIQUE DE PERMISSION (EXEMPLE) ---
    // Ici, on autorise seulement le propriétaire du fichier à le télécharger.
    // Vous pourriez avoir une logique plus complexe (ex: un client peut voir le CV d'un candidat).
    if (attachment.ownerId !== req.user.id) {
        // Pour un admin, on pourrait laisser passer.
        if (req.user.role !== 'admin') {
            logger.warn(`Tentative d'accès non autorisé au fichier ${filename} par l'utilisateur ${req.user.id}`);
            return res.status(403).json({ success: false, error: "Accès non autorisé." });
        }
    }

    const filePath = attachment.path;

    // 2. Vérifier si le fichier existe physiquement sur le disque
    if (!fs.existsSync(filePath)) {
      logger.error(`Incohérence: Fichier ${filename} trouvé en BDD mais absent du disque.`);
      return res.status(404).json({ error: "Fichier introuvable sur le disque." });
    }
    
    // On se base sur le mimetype enregistré qui est plus fiable.
    res.setHeader("Content-Type", attachment.mimetype);
    
    // L'option 'inline' essaie d'afficher le fichier dans le navigateur (PDF, image),
    // 'attachment' force le téléchargement.
    res.setHeader("Content-Disposition", `inline; filename="${attachment.originalName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    logger.error("Erreur serveur fichier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;