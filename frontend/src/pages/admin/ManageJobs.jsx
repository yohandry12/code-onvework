import React, { useState, useEffect } from "react";
import {
  BriefcaseIcon,
  FunnelIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_BADGES = {
  draft: {
    color: "bg-gray-100 text-gray-800",
    icon: ClockIcon,
    label: "Brouillon",
  },
  pending: {
    color: "bg-indigo-100 text-indigo-800",
    icon: ClockIcon,
    label: "En attente",
  },
  published: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
    label: "Publié",
  },
  closed: {
    color: "bg-red-100 text-red-800",
    icon: XCircleIcon,
    label: "Fermé",
  },
  reported: {
    color: "bg-yellow-100 text-yellow-800",
    icon: ExclamationTriangleIcon,
    label: "Signalé",
  },

  filled: {
    color: "bg-gray-100 text-gray-800",
    icon: BriefcaseIcon,
    label: "terminé",
  },
  // Fallback si statut inconnu
  default: {
    color: "bg-gray-100 text-gray-800",
    icon: ClockIcon,
    label: "En cours",
  },
};

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    isFrozen: "",
    page: 1,
    limit: 10,
  });
  const [totalJobs, setTotalJobs] = useState(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await apiService.jobs.adminGetAll(filters);
      setJobs(response.jobs);
      setTotalJobs(response.pagination.total);
    } catch (error) {
      toast.error("Erreur lors du chargement des offres d'emploi");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleUnfreeze = async (jobId) => {
    try {
      await apiService.jobs.adminUnfreeze(jobId);
      toast.success("L'offre d'emploi a été dégelée avec succès");
      fetchJobs();
    } catch (error) {
      toast.error("Erreur lors du dégel de l'offre d'emploi");
    }
  };

  const handleApprove = async (jobId) => {
    if (!window.confirm("Valider cette offre et la publier ?")) return;
    try {
      await apiService.jobs.adminApprove(jobId);
      toast.success("Offre validée et publiée avec succès");
      fetchJobs();
    } catch (error) {
      toast.error("Erreur lors de l'approbation de l'offre");
    }
  };

  const handleDelete = async (jobId) => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette offre d'emploi ?"
      )
    ) {
      try {
        await apiService.jobs.adminDelete(jobId);
        toast.success("L'offre d'emploi a été supprimée avec succès");
        fetchJobs();
      } catch (error) {
        toast.error("Erreur lors de la suppression de l'offre d'emploi");
      }
    }
  };

  const totalPages = Math.ceil(totalJobs / filters.limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BriefcaseIcon className="h-8 w-8 mr-2 text-indigo-600" />
          Gestion des offres d'emploi
        </h1>

        {/* Filtres */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border-0 bg-transparent focus:ring-0 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
              }
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="pending">En attente</option>
              <option value="published">Publiés</option>
              <option value="filled">Terminée</option>
              <option value="reported">Signalés</option>
            </select>
          </div>

          {/* <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border-0 bg-transparent focus:ring-0 text-sm"
              value={filters.isFrozen}
              onChange={(e) =>
                setFilters((f) => ({ ...f, isFrozen: e.target.value, page: 1 }))
              }
            >
              <option value="">Tous les états</option>
              <option value="true">Gelés</option>
              <option value="false">Actifs</option>
            </select>
          </div> */}
        </div>
      </div>

      {/* Tableau des offres */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin text-indigo-600" />
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aucune offre d'emploi trouvée
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const StatusBadge =
                    STATUS_BADGES[job.status] || STATUS_BADGES.default;
                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job.companyName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${StatusBadge.color}`}
                        >
                          <StatusBadge.icon className="h-4 w-4 mr-1" />
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(job.createdAt), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.isFrozen
                              ? "bg-red-100 text-red-800"
                              : job.status === "pending"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {job.isFrozen
                            ? "Gelé"
                            : job.status === "pending"
                            ? "En attente"
                            : "Actif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() =>
                            window.open(`/jobs/${job.id}`, "_blank")
                          }
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Voir l'offre"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {job.isFrozen && (
                          <button
                            onClick={() => handleUnfreeze(job.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Dégeler l'offre"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                        )}
                        {job.status === "pending" && (
                          <button
                            onClick={() => handleApprove(job.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Valider l'offre"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer l'offre"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
              }
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Précédent
            </button>
            <button
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  page: Math.min(totalPages, f.page + 1),
                }))
              }
              disabled={filters.page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">
                  {Math.min((filters.page - 1) * filters.limit + 1, totalJobs)}
                </span>{" "}
                à{" "}
                <span className="font-medium">
                  {Math.min(filters.page * filters.limit, totalJobs)}
                </span>{" "}
                sur <span className="font-medium">{totalJobs}</span> résultats
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
                  }
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Précédent
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      filters.page === i + 1
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      page: Math.min(totalPages, f.page + 1),
                    }))
                  }
                  disabled={filters.page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Suivant
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageJobs;
