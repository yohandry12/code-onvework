// src/components/JobsHeader.jsx
import React from "react";
import PropTypes from "prop-types";

const plural = (n, singular, pluralForm) =>
  n > 1 ? pluralForm || `${singular}s` : singular;

// --- COMPOSANT MIS À JOUR ---
export default function JobsHeader({
  jobsCount = 0, // <-- Changement 1: Accepter 'jobsCount' (un nombre) au lieu de 'jobs' (un tableau)
  stats = {},
}) {
  const safeStats = {
    totalApplications: stats.totalApplications ?? 0,
    pending: stats.pending ?? 0,
    accepted: stats.accepted ?? 0,
  };

  // Changement 2: La logique 'selectedJob' n'est plus nécessaire dans ce header, on la supprime pour plus de clarté.

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="font-medium">
                {/* <-- Changement 3: Utiliser la prop 'jobsCount' directement --> */}
                {jobsCount} {plural(jobsCount, "offre")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              <span className="font-medium">
                {safeStats.totalApplications}{" "}
                {plural(safeStats.totalApplications, "candidature")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="font-medium">
                {safeStats.pending} {plural(safeStats.pending, "candidature")}{" "}
                en attente
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <span className="font-medium">
                {safeStats.accepted} {plural(safeStats.accepted, "candidat")}{" "}
                retenu{safeStats.accepted > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

JobsHeader.propTypes = {
  jobsCount: PropTypes.number,
  stats: PropTypes.object,
};
