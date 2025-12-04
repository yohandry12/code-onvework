import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'resolved', 'dismissed'

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.reports.getAllForAdmin();
      if (response && response.success && Array.isArray(response.reports)) {
        setReports(response.reports);
      } else {
        setReports([]);
      }
    } catch (err) {
      toast.error("Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // --- LOGIQUE DE FILTRAGE ---
  useEffect(() => {
    let result = [...reports];
    if (filter === "pending") {
      result = result.filter((r) => r.status === "pending");
    } else if (filter === "resolved") {
      result = result.filter((r) => r.status === "resolved");
    } else if (filter === "dismissed") {
      result = result.filter((r) => r.status === "dismissed");
    }
    setFilteredReports(result);
  }, [reports, filter]);

  const handleUpdateStatus = async (reportId, status) => {
    try {
      // Optimistic update
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      await apiService.reports.updateStatus(reportId, status);
      toast.success(
        `Signalement marqué comme ${
          status === "resolved" ? "résolu" : "rejeté"
        }`
      );
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour.");
      fetchReports(); // Rollback
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer ce signalement de l'historique ?"
      )
    )
      return;

    try {
      setReports((prev) => prev.filter((r) => r.id !== id));
      await apiService.reports.delete(id);
      toast.success("Signalement supprimé.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression.");
      fetchReports();
    }
  };

  // Helper pour le contenu signalé
  const renderReportedContent = (report) => {
    const content = report.content;
    if (!content)
      return <span className="text-gray-400 italic">Contenu supprimé</span>;

    let linkTo, title;
    if (report.contentType === "job") {
      linkTo = `/jobs/${content.id}`;
      title = content.title;
    } else {
      linkTo = `/profile/${content.id}`; // Adapter selon votre route profil
      title =
        `${content.profile?.firstName || ""} ${
          content.profile?.lastName || ""
        }`.trim() || "Profil utilisateur";
    }

    return (
      <div className="flex flex-col">
        <Link
          to={linkTo}
          target="_blank"
          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-xs"
        >
          {title}
        </Link>
        <span className="text-xs text-gray-400 capitalize mt-0.5 flex items-center gap-1">
          {report.contentType === "job" ? "Mission" : "Utilisateur"}
        </span>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestion des Signalements
        </h1>

        {/* --- BARRE DE FILTRES --- */}
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          {["all", "pending", "resolved", "dismissed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === f
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" && "Tous"}
              {f === "pending" && "En attente"}
              {f === "resolved" && "Résolus"}
              {f === "dismissed" && "Rejetés"}
            </button>
          ))}
        </div>
      </div>

      {/* COMPTEUR */}
      <div className="mb-4 text-sm text-gray-500">
        Affichage de{" "}
        <span className="font-bold text-gray-900">
          {filteredReports.length}
        </span>{" "}
        signalement(s).
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contenu
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Raison
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Signalé par
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-12 text-gray-400 italic"
                  >
                    Aucun signalement ne correspond à ce filtre.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {renderReportedContent(report)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-red-600 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {report.reason}
                      </div>
                      {report.comment && (
                        <p
                          className="text-xs text-gray-500 mt-1 italic max-w-xs truncate"
                          title={report.comment}
                        >
                          "{report.comment}"
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {`${report.reporter?.profile?.firstName || ""} ${
                          report.reporter?.profile?.lastName || ""
                        }` || "Anonyme"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* STATUT */}
                    <td className="px-6 py-4 text-center">
                      {report.status === "resolved" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Résolu
                        </span>
                      )}
                      {report.status === "dismissed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Rejeté
                        </span>
                      )}
                      {report.status === "pending" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse">
                          En attente
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* RÉSOUDRE (Valider le signalement -> Bannir/Supprimer contenu) */}
                        {report.status !== "resolved" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(report.id, "resolved")
                            }
                            title="Marquer comme Résolu (Action prise)"
                            className="p-2 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}

                        {/* REJETER (Faux positif) */}
                        {report.status !== "dismissed" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(report.id, "dismissed")
                            }
                            title="Rejeter le signalement (Aucune action)"
                            className="p-2 rounded-lg bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}

                        {/* SUPPRIMER (De la liste) */}
                        <button
                          onClick={() => handleDelete(report.id)}
                          title="Supprimer de l'historique"
                          className="p-2 rounded-lg bg-white border border-gray-300 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors ml-2"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageReports;
