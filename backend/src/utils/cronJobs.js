// utils/cronJobs.js
const cron = require("node-cron");
const { Job } = require("../models");
const { Op } = require("sequelize");
const { logger } = require("./logger");

/**
 * Tâche CRON qui archive les missions terminées après 1 mois
 * Exécutée tous les jours à 2h du matin
 */
function startJobArchiveCron() {
  cron.schedule("0 2 * * *", async () => {
    try {
      logger.info("🕒 Démarrage de l'archivage automatique des missions...");

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Option 1 : Changer le statut vers "archived"
      const result = await Job.update(
        { status: "archived" }, // Nouveau statut
        {
          where: {
            status: "filled",
            updatedAt: { [Op.lt]: oneMonthAgo },
          },
        }
      );

      logger.info(`✅ ${result[0]} missions archivées automatiquement`);

      // Option 2 (alternative) : Supprimer définitivement
      // const result = await Job.destroy({
      //   where: {
      //     status: 'filled',
      //     updatedAt: { [Op.lt]: oneMonthAgo }
      //   }
      // });
      // logger.info(`🗑️ ${result} missions supprimées automatiquement`);
    } catch (error) {
      logger.error("❌ Erreur lors de l'archivage automatique:", error);
    }
  });

  logger.info("✅ Tâche CRON d'archivage activée (tous les jours à 2h)");
}

module.exports = { startJobArchiveCron };
