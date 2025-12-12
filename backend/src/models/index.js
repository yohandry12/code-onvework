const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
  }
);

const db = {};

// Import des modèles User (qui contient aussi les profils)
const userModels = require("./User")(sequelize);
db.User = userModels.User;
db.CandidateProfile = userModels.CandidateProfile;
db.ClientProfile = userModels.ClientProfile;
db.TrainerProfile = userModels.TrainerProfile;
db.AdminProfile = userModels.AdminProfile;

// Import des autres modèles
db.Application = require("./Application")(sequelize);
db.Job = require("./Job")(sequelize);
db.Testimonial = require("./Testimonial")(sequelize);
db.Report = require("./Report")(sequelize);
db.Recommendation = require("./Recommendation")(sequelize);
db.UserSettings = require("./UserSettings")(sequelize);
db.Activity = require("./Activity")(sequelize);
// Cities
db.City = require("./City")(sequelize);
db.PlatformSetting = require("./PlatformSetting")(sequelize);
db.Training = require("./Training")(sequelize);
db.Module = require("./Module")(sequelize);
db.Lesson = require("./Lesson")(sequelize);
db.Certificate = require("./Certificate")(sequelize);
db.Enrollment = require("./Enrollment")(sequelize);
db.Review = require("./Review")(sequelize);
db.TrainerRating = require("./TrainerRating")(sequelize, Sequelize.DataTypes);

db.User.hasOne(db.UserSettings, {
  foreignKey: "userId",
  as: "settings",
  onDelete: "CASCADE", // Supprime les paramètres si l'utilisateur est supprimé
});
db.UserSettings.belongsTo(db.User, { foreignKey: "userId" });
// --- Relations (le reste reste identique) ---
db.User.hasMany(db.Job, {
  foreignKey: "clientId",
  as: "postedJobs",
  constraints: false,
});
db.Job.belongsTo(db.User, {
  foreignKey: "clientId",
  as: "client",
});

db.Job.hasMany(db.Application, {
  foreignKey: "jobId",
  as: "applications",
});
db.Application.belongsTo(db.Job, {
  foreignKey: "jobId",
  as: "job",
});

db.User.hasMany(db.Application, {
  foreignKey: "candidateId",
  as: "submittedApplications",
});
db.Application.belongsTo(db.User, {
  foreignKey: "candidateId",
  as: "candidate",
});

db.User.hasMany(db.Testimonial, {
  foreignKey: "authorId",
  as: "testimonials",
  onDelete: "CASCADE",
});
db.Testimonial.belongsTo(db.User, {
  foreignKey: "authorId",
  as: "author",
});

db.User.hasMany(db.Report, {
  foreignKey: "reporterId",
  as: "reportsMade",
  onDelete: "CASCADE",
});
db.Report.belongsTo(db.User, {
  foreignKey: "reporterId",
  as: "reporter",
});

// Activités utilisateur
db.User.hasMany(db.Activity, {
  foreignKey: "userId",
  as: "activities",
  onDelete: "CASCADE",
});
db.Activity.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// db.Job.hasMany(db.Report, {
//   foreignKey: 'contentId',
//   constraints: false,
//   scope: { contentType: 'job' },
//   as: 'reports'
// });

// db.User.hasMany(db.Report, {
//   foreignKey: 'contentId',
//   constraints: false,
//   scope: { contentType: 'user' },
//   as: 'reportsReceived'
// });

db.Job.hasMany(db.Job, {
  foreignKey: "clonedFromId", // La clé dans la table qui pointe vers l'original
  as: "clones", // Permettra de faire `originalJob.getClones()`
});

// Un Job (le clone) appartient à un seul Job (l'original).
db.Job.belongsTo(db.Job, {
  foreignKey: "clonedFromId",
  as: "originalJob", // Permettra de faire `clonedJob.getOriginalJob()`
});

db.Report.belongsTo(db.Job, {
  foreignKey: "contentId",
  constraints: false,
  as: "job",
});
db.Report.belongsTo(db.User, {
  foreignKey: "contentId",
  constraints: false,
  as: "user",
});

// Une recommandation appartient à UNE SEULE mission (Job)
db.Job.hasMany(db.Recommendation, {
  foreignKey: "jobId",
  as: "recommendations",
});
db.Recommendation.belongsTo(db.Job, { foreignKey: "jobId", as: "job" });

// Une recommandation est écrite par UN SEUL utilisateur (l'employeur)
db.User.hasMany(db.Recommendation, {
  foreignKey: "employerId",
  as: "recommendationsGiven",
});
db.Recommendation.belongsTo(db.User, {
  foreignKey: "employerId",
  as: "employer",
});

db.User.hasMany(db.TrainerRating, { foreignKey: "trainer_id", as: "ratings" });
db.User.hasMany(db.TrainerRating, {
  foreignKey: "user_id",
  as: "givenRatings",
});

// ============================================
// RELATIONS FORMATEUR -> FORMATIONS
// ============================================
// Un User (Formateur) crée des formations
db.User.hasMany(db.Training, {
  foreignKey: "trainerId",
  as: "createdTrainings",
});
db.Training.belongsTo(db.User, { foreignKey: "trainerId", as: "trainer" });

// ============================================
// HIERARCHIE PEDAGOGIQUE
// ============================================
db.Training.hasMany(db.Module, {
  foreignKey: "trainingId",
  as: "modules",
  onDelete: "CASCADE",
});
db.Module.belongsTo(db.Training, { foreignKey: "trainingId", as: "training" });

db.Module.hasMany(db.Lesson, {
  foreignKey: "moduleId",
  as: "lessons",
  onDelete: "CASCADE",
});
db.Lesson.belongsTo(db.Module, { foreignKey: "moduleId", as: "module" });

// ============================================
// RELATIONS CANDIDAT -> INSCRIPTIONS
// ============================================

// 1. Un User (Candidat) a plusieurs inscriptions
db.User.hasMany(db.Enrollment, {
  foreignKey: "candidateId",
  as: "enrollments",
});

// 2. Une Inscription appartient à un User (Candidat)
db.Enrollment.belongsTo(db.User, {
  foreignKey: "candidateId",
  as: "candidate",
});

// 3. Une Formation a plusieurs Inscriptions
db.Training.hasMany(db.Enrollment, {
  foreignKey: "trainingId",
  as: "students",
});
db.Enrollment.belongsTo(db.Training, {
  foreignKey: "trainingId",
  as: "training",
});

// ============================================
// RELATIONS CERTIFICATS
// ============================================
db.User.hasMany(db.Certificate, {
  foreignKey: "candidateId",
  as: "certificates",
});
db.Certificate.belongsTo(db.User, {
  foreignKey: "candidateId",
  as: "candidate",
});

db.Training.hasMany(db.Certificate, {
  foreignKey: "trainingId",
  as: "issuedCertificates",
});
db.Certificate.belongsTo(db.Training, {
  foreignKey: "trainingId",
  as: "training",
});

// Une formation a plusieurs avis
db.Training.hasMany(db.Review, { foreignKey: "trainingId", as: "reviews" });
db.Review.belongsTo(db.Training, { foreignKey: "trainingId", as: "training" });

// Un utilisateur écrit plusieurs avis
db.User.hasMany(db.Review, { foreignKey: "userId", as: "reviewsWritten" });
db.Review.belongsTo(db.User, { foreignKey: "userId", as: "student" });

// Un formateur reçoit des avis (via ses cours)
db.User.hasMany(db.Review, { foreignKey: "trainerId", as: "reviewsReceived" });
db.Review.belongsTo(db.User, { foreignKey: "trainerId", as: "trainer" });

// Une recommandation concerne UN SEUL utilisateur (l'employé/candidat)
db.User.hasMany(db.Recommendation, {
  foreignKey: "employeeId",
  as: "recommendationsReceived",
});
db.Recommendation.belongsTo(db.User, {
  foreignKey: "employeeId",
  as: "employee",
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// --- 2. FONCTION D'INITIALISATION DES TAUX ---
// Cette fonction sera appelée au démarrage du serveur
db.initSettings = async () => {
  try {
    const defaults = [
      { key: "rate_candidate", value: 70, description: "Part du candidat (%)" },
      {
        key: "rate_training",
        value: 20,
        description: "Fonds de formation (%)",
      },
      {
        key: "rate_platform",
        value: 10,
        description: "Commission plateforme (%)",
      },
    ];

    for (const setting of defaults) {
      await db.PlatformSetting.findOrCreate({
        where: { key: setting.key },
        defaults: setting,
      });
    }
    console.log("✅ Paramètres financiers initialisés.");
  } catch (error) {
    console.error("❌ Erreur init settings:", error);
  }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
