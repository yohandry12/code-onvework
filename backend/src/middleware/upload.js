const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- CORRECTION CLÉ : Utiliser process.cwd() pour un chemin fiable ---
// process.cwd() donne la racine du projet où vous avez lancé 'npm run dev'.
// On construit un chemin absolu vers 'backend/uploads'. C'est beaucoup plus robuste.
const uploadDir = path.resolve(process.cwd(), "uploads");

// On ajoute des logs pour savoir exactement où Multer pense que le dossier se trouve.
console.log(`[Multer] Chemin du dossier d'upload configuré sur : ${uploadDir}`);

// Tenter de créer le dossier s'il n'existe pas.
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Multer] Dossier d'upload créé avec succès.`);
  }
} catch (error) {
  // Si cette erreur apparaît, c'est un problème de permissions.
  console.error(
    `[Multer] ERREUR CRITIQUE : Impossible de créer le dossier d'upload.`,
    error
  );
}

// Configurer le stockage (comment nommer et où placer les fichiers)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // --- NOUVEAUTÉ : Vérifier les permissions d'écriture ---
    // Avant chaque upload, on s'assure que le dossier est bien accessible en écriture.
    fs.access(uploadDir, fs.constants.W_OK, (err) => {
      if (err) {
        console.error(
          `[Multer] ERREUR : Le dossier ${uploadDir} n'est pas accessible en écriture.`
        );
        // On renvoie l'erreur à Multer, qui arrêtera proprement le processus.
        return cb(err);
      }
      // Si tout est OK, on continue.
      cb(null, uploadDir);
    });
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Le reste de votre configuration est correct.
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
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
