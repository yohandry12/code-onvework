import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Appel de l'API
      const response = await apiService.reports.getAllForAdmin();

      // 2. --- CORRECTION CLÉ : Extraire le tableau de la réponse ---
      if (response && response.success && Array.isArray(response.reports)) {
        setReports(response.reports);
      } else {
        console.error("Format de réponse inattendu:", response);
        setReports([]); // S'assurer que 'reports' reste un tableau
      }
    } catch (err) {
      setError("Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId, status) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment marquer ce signalement comme "${status}" ?`
      )
    ) {
      return;
    }

    try {
      // On passe directement la valeur du statut, pas un objet
      await apiService.reports.updateStatus(reportId, status);
      setReports((prev) => prev.filter((report) => report.id !== reportId));
    } catch (err) {
      // Afficher le message d'erreur spécifique s'il existe
      alert(err.message || "Erreur lors de la mise à jour du statut.");
      console.error(err);
    }
  };

  // Fonction d'aide pour afficher le contenu signalé (polymorphique)
  const renderReportedContent = (report) => {
    const content = report.content;
    if (!content) {
      return (
        <span className="text-gray-400 italic">
          Contenu supprimé ou indisponible
        </span>
      );
    }

    let linkTo, title;

    if (report.contentType === "job") {
      linkTo = `/jobs/${content.id}`;
      title = content.title;
    } else if (report.contentType === "user") {
      // Mettez le bon chemin pour un profil utilisateur
      linkTo = `/profile/${content.id}`;
      title =
        `${content.profile?.firstName || ""} ${
          content.profile?.lastName || ""
        }`.trim() || "Profil utilisateur";
    } else {
      return <span>Contenu de type inconnu</span>;
    }

    return (
      <>
        <Link
          to={linkTo}
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          {title}
        </Link>
        <div className="text-sm text-gray-500 capitalize">
          {report.contentType}
        </div>
      </>
    );
  };

  if (loading)
    return (
      <div className="text-center p-8">
        Chargement des signalements en attente...
      </div>
    );
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Gestion des Signalements
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contenu Signalé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Raison
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Signalé par
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  Aucun signalement en attente.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 text-sm font-medium">
                    {renderReportedContent(report)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-red-600">
                      {report.reason}
                    </div>
                    {report.comment && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        "{report.comment}"
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {`${report.reporter?.profile?.firstName} ${report.reporter?.profile?.lastName}` ||
                      "Utilisateur Anonyme"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(report.id, "resolved")}
                      title="Marquer comme Résolu (action prise)"
                      className="p-2 rounded-full text-green-600 bg-green-100 hover:bg-green-200"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, "dismissed")}
                      title="Rejeter le signalement (aucune action)"
                      className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReports;
