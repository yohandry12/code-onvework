import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../services/api";
import { useDebounce } from "use-debounce";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  AcademicCapIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const ManageTrainings = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  // Filtres
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.trainings.adminGetAll({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter,
      });
      if (response.success) {
        setTrainings(response.trainings);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Erreur chargement formations:", error);
      toast.error("Impossible de charger les formations.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  // Actions
  const handleApprove = async (id) => {
    if (!window.confirm("Voulez-vous approuver et publier cette formation ?"))
      return;
    try {
      await apiService.trainings.adminApprove(id);
      toast.success("Formation approuvée !");
      fetchTrainings();
    } catch (error) {
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Motif du rejet (optionnel) :");
    if (reason === null) return; // Annulé

    try {
      await apiService.trainings.adminReject(id, reason);
      toast.success("Formation rejetée.");
      fetchTrainings();
    } catch (error) {
      toast.error("Erreur lors du rejet.");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette formation définitivement ?"
      )
    )
      return;
    try {
      await apiService.trainings.adminDelete(id);
      toast.success("Formation supprimée.");
      fetchTrainings();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
            Publié
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">
            En attente
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
            Rejeté
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
            Brouillon
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
            Gestion des Formations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination?.total || 0} formations trouvées
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/admin/trainings/create")}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700"
          >
            <PlusIcon className="w-5 h-5" /> Créer une formation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* --- BARRE DE FILTRES --- */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b bg-gray-50/50">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente de validation</option>
              <option value="published">Publiées</option>
              <option value="rejected">Rejetées</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
        </div>

        {/* --- TABLEAU --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-3 text-left">Formation</th>
                <th className="px-6 py-3 text-left">Formateur</th>
                <th className="px-6 py-3 text-left">Prix</th>
                <th className="px-6 py-3 text-center">Statut</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    Chargement...
                  </td>
                </tr>
              ) : trainings.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500 italic"
                  >
                    Aucune formation trouvée.
                  </td>
                </tr>
              ) : (
                trainings.map((training) => (
                  <tr
                    key={training.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-200 overflow-hidden mr-3">
                          {training.thumbnail ? (
                            <img
                              src={training.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <AcademicCapIcon className="h-6 w-6 text-gray-400 m-2" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {training.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {training.category} • {training.level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {training.trainer?.trainerProfile?.firstName}{" "}
                      {training.trainer?.trainerProfile?.lastName}
                      <br />
                      <span className="text-xs text-gray-400">
                        {training.trainer?.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {training.price > 0
                        ? `${Number(training.price).toLocaleString()} FCFA`
                        : "Gratuit"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(training.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(training.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton Voir (Placeholder pour l'instant) */}
                        <button
                          title="Voir les détails"
                          className="p-1 text-gray-400 hover:text-indigo-600"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>

                        {/* Actions de validation */}
                        {training.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(training.id)}
                              title="Approuver"
                              className="p-1 text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(training.id)}
                              title="Rejeter"
                              className="p-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() =>
                            navigate(`/admin/trainings/${training.id}/edit`)
                          } // <--- MODIFICATION
                          title="Modifier"
                          className="p-1.5 text-gray-500 hover:text-orange-600 bg-gray-100 hover:bg-orange-50 rounded"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDelete(training.id)}
                          title="Supprimer"
                          className="p-1.5 text-red-500 hover:text-red-700 bg-gray-100 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        {pagination && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-700">
              Page {pagination.page} sur{" "}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pagination.limit >= pagination.total}
                className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTrainings;
