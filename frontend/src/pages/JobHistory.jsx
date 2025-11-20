import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import {
  BriefcaseIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon as PencilAltIcon,
  DocumentDuplicateIcon as DuplicateIcon,
} from "@heroicons/react/24/outline";

// Composant de Pagination (peut être extrait dans un fichier séparé)
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Précédent
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 text-sm font-medium border rounded-md ${
            currentPage === page
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
};

// Helper pour afficher des badges de statut colorés
const StatusBadge = ({ status }) => {
  const statusStyles = {
    published: "bg-blue-100 text-blue-800",
    filled: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    closed: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-800",
  };
  const statusText = {
    published: "Publiée",
    filled: "Terminée",
    paused: "En pause",
    closed: "Fermée",
    pending: "En attente",
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {statusText[status] || status}
    </span>
  );
};

export default function JobHistory() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (page) => {
    setLoading(true);
    try {
      const response = await apiService.jobs.getMyJobHistory({ page });
      setJobs(response.jobs);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Erreur chargement de l'historique:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(pagination.currentPage);
  }, [pagination.currentPage, fetchHistory]);

  const handleCloneAndEdit = (jobId) => {
    // Pas besoin de confirmation ici, car l'action n'est pas destructive.
    // L'utilisateur sera redirigé vers un formulaire qu'il peut quitter.

    // On navigue vers la page de création en ajoutant un paramètre d'URL `cloneFrom`
    // Assurez-vous que le chemin '/client/create-job' correspond bien à votre route
    navigate(`/jobs/create?cloneFrom=${jobId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Historique de mes missions
      </h1>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Titre de la mission
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Statut
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Candidatures
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {job.applicationCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                      <Link
                        to="/manage-applications"
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Voir les candidats"
                      >
                        <UsersIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        // On appelle la nouvelle fonction
                        onClick={() => handleCloneAndEdit(job.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Utiliser comme modèle pour une nouvelle mission"
                      >
                        <DuplicateIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    Vous n'avez encore publié aucune mission.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) =>
                setPagination((p) => ({ ...p, currentPage: page }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
