// backend/utils/stats.js
const { Application, Job } = require("../models");

/**
 * Nombre de missions TERMINÉES pour un candidat
 */
exports.getCompletedJobsCount = async (candidateId) => {
  return await Application.count({
    where: {
      candidateId,
      status: "accepted",
    },
    include: [
      {
        model: Job,
        as: "job",
        where: { status: "filled" },
        attributes: [], // on ne récupère rien de la table Job
      },
    ],
  });
};
