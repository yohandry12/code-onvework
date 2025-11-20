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
db.AdminProfile = userModels.AdminProfile;

// Import des autres modèles
db.Application = require("./Application")(sequelize);
db.Job = require("./Job")(sequelize);
db.Attachment = require("./Attachment")(sequelize);
db.Testimonial = require("./Testimonial")(sequelize);
db.Report = require("./Report")(sequelize);
db.Recommendation = require("./Recommendation")(sequelize);
db.UserSettings = require("./UserSettings")(sequelize);
db.Activity = require("./Activity")(sequelize);

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

db.User.hasMany(db.Attachment, { foreignKey: "ownerId", as: "attachments" });
db.Attachment.belongsTo(db.User, { foreignKey: "ownerId", as: "owner" });

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

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
