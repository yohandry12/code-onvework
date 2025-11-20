import React, { useState } from "react";
import { apiService } from "../../services/api";
import { XMarkIcon, FlagIcon } from "@heroicons/react/24/outline";

const ReportModal = ({ contentId, contentType, onClose }) => {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    "Spam",
    "Contenu inapproprié",
    "Informations trompeuses",
    "Fraude / Arnaque",
    "Autre",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Veuillez sélectionner une raison pour le signalement.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await apiService.reports.create({
        contentId,
        contentType,
        reason,
        comment,
      });
      setSuccess(response.message);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FlagIcon className="h-6 w-6 mr-2 text-red-500" /> Signaler ce
            contenu
          </h2>
          <button onClick={onClose}>
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {success ? (
            <div className="p-8 text-center">
              <p className="text-green-600 font-semibold">{success}</p>
            </div>
          ) : (
            <>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du signalement *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Sélectionnez une raison...
                    </option>
                    {reportReasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Donnez plus de détails si nécessaire..."
                  ></textarea>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-300"
                >
                  {loading ? "Envoi..." : "Envoyer le signalement"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
