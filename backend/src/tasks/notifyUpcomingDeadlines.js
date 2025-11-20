/**
 * Tâche planifiée : notifier les candidats lorsque la date de fin d'une mission approche.
 * - Recherche les candidatures acceptées dont la mission a une `deadline` dans les X prochains jours
 * - Crée une Activity de type `deadline-warning` pour le candidat (si elle n'existe pas déjà)
 * - Émet un événement socket `activity` vers la room `user-<id>`
 */

module.exports = function startNotifyUpcomingDeadlines(db, io, opts = {}) {
  const { Application, Job, Activity } = db;
  const { Op } = require("sequelize");
  const logger = require("../utils/logger").logger;

  const daysBefore = Number(opts.daysBefore) || 3; // par défaut 3 jours
  const intervalMs = Number(opts.intervalMs) || 1000 * 60 * 60 * 6; // toutes les 6h

  const runOnce = async () => {
    try {
      const now = new Date();
      const upper = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);

      logger.info(
        `Vérification des deadlines entre ${now.toISOString()} et ${upper.toISOString()}`
      );

      // On récupère les candidatures acceptées (on filtrera en JavaScript selon la date de fin calculée)
      const apps = await Application.findAll({
        where: { status: "accepted" },
        include: [
          {
            model: Job,
            as: "job",
            attributes: [
              "id",
              "title",
              "startDate",
              "durationValue",
              "durationUnit",
              "deadline",
            ],
          },
        ],
      });

      const computeEndDate = (job) => {
        if (!job) return null;

        // Priorité : calculer la fin à partir de startDate + durationValue/durationUnit
        if (job.startDate && job.durationValue && job.durationUnit) {
          try {
            const start = new Date(job.startDate);
            const val = Number(job.durationValue);
            if (Number.isNaN(val) || val <= 0) return null;

            switch ((job.durationUnit || "").toString()) {
              case "heures":
                return new Date(start.getTime() + val * 60 * 60 * 1000);
              case "jours":
                return new Date(start.getTime() + val * 24 * 60 * 60 * 1000);
              case "semaines":
                return new Date(
                  start.getTime() + val * 7 * 24 * 60 * 60 * 1000
                );
              case "mois": {
                const d = new Date(start);
                d.setMonth(d.getMonth() + val);
                return d;
              }
              default:
                // 'projet' ou autre -> pas de date calculable
                return null;
            }
          } catch (err) {
            return null;
          }
        }

        // Fallback : si aucune date de fin calculable, utiliser le champ deadline si présent
        if (job.deadline) return new Date(job.deadline);
        return null;
      };

      for (const app of apps) {
        const candidateId = app.candidateId || app.candidate?.id;
        const job = app.job;
        if (!candidateId || !job) continue;

        const endDate = computeEndDate(job);
        if (!endDate) continue; // rien à notifier si on ne peut pas déterminer la date de fin

        if (endDate < now) continue; // déjà passée
        if (endDate > upper) continue; // trop éloignée

        const msLeft = endDate - now;
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

        // Ne pas dupliquer les notifications : vérifier si une activité similaire existe
        const existing = await Activity.findOne({
          where: {
            userId: candidateId,
            type: "deadline-warning",
            referenceId: job.id,
          },
        });

        if (existing) {
          logger.debug(
            `Notification déjà envoyée pour job ${job.id} -> user ${candidateId}`
          );
          continue;
        }

        const readableDate = endDate.toLocaleDateString();
        const message = `Attention : la mission \"${job.title}\" se termine dans ${daysLeft} jour(s) (${readableDate}).`;

        const activity = await Activity.create({
          userId: candidateId,
          type: "deadline-warning",
          message,
          referenceId: job.id,
          referenceType: "job",
          status: "new",
          meta: {
            daysLeft,
            computedFrom: job.startDate
              ? "startDate+duration"
              : job.deadline
              ? "deadline"
              : "unknown",
          },
        });

        try {
          if (io && typeof io.to === "function") {
            io.to(`user-${candidateId}`).emit("activity", activity);
          }
        } catch (err) {
          logger.warn(
            "Impossible d'émettre la notification socket :",
            err.message || err
          );
        }

        logger.info(
          `Notification deadline créée pour user ${candidateId} job ${job.id}`
        );
      }
    } catch (err) {
      logger.error("Erreur lors de la vérification des deadlines :", err);
    }
  };

  // Lancer la première passe immédiatement
  runOnce();

  // Planifier la tâche
  const timer = setInterval(runOnce, intervalMs);

  // Retourner une fonction d'arrêt si besoin
  return () => clearInterval(timer);
};
