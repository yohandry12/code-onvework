const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Chemins absolus
const uploadDir = path.resolve(process.cwd(), "uploads");
const avatarDir = path.resolve(process.cwd(), "avatar");

console.log(`[Multer] Uploads: ${uploadDir}`);
console.log(`[Multer] Avatars: ${avatarDir}`);

// Création des dossiers si inexistants
[uploadDir, avatarDir].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error(`[Multer] Erreur création dossier ${dir}:`, error);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // --- LOGIQUE DE SÉLECTION DU DOSSIER ---
    // Si le champ s'appelle "avatar", on va dans le dossier avatar.
    // Sinon, on va dans le dossier uploads standard.
    const targetDir = file.fieldname === "avatar" ? avatarDir : uploadDir;

    // Vérification des permissions
    fs.access(targetDir, fs.constants.W_OK, (err) => {
      if (err) {
        console.error(`[Multer] Erreur permission écriture sur ${targetDir}`);
        return cb(err);
      }
      cb(null, targetDir);
    });
  },
  filename: (req, file, cb) => {
    // Nettoyage du nom de fichier pour éviter les caractères spéciaux
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non supporté."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

module.exports = upload;
