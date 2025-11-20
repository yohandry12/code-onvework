import React, { useState } from "react";
import { apiService } from "../services/api";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ApplicationForm = ({ jobId, onClose, onSubmitted }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- GESTION DES FICHIERS ---
  const handleFileChange = (e) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    setAttachments(selectedFiles);
    console.log("📎 Fichiers sélectionnés :", selectedFiles);
  };

  // --- VALIDATION DU FORMULAIRE ---
  const validateForm = () => {
    if (coverLetter.trim().length < 50) {
      setError(
        "Votre lettre de motivation doit contenir au moins 50 caractères."
      );
      return false;
    }
    setError("");
    return true;
  };

  // --- ENVOI DU FORMULAIRE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    setUploadProgress(0); // Réinitialiser la progression

    try {
      // --- CORRECTION : Configurer l'appel pour suivre la progression ---
      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      };

      await apiService.applications.create(
        jobId,
        { coverLetter, attachments },
        config // On passe la configuration
      );
      onSubmitted();
    } catch (err) {
      // Si l'erreur est un timeout, on affiche un message plus clair
      if (err.code === "ECONNABORTED") {
        setError(
          "L'envoi a pris trop de temps et a été annulé. Veuillez réessayer avec une meilleure connexion ou des fichiers plus petits."
        );
      } else {
        setError(err.response?.data?.error || "Une erreur est survenue.");
      }
      console.error("❌ Erreur complète:", err);
    } finally {
      setLoading(false);
      setUploadProgress(0); // Nettoyer après la fin
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Postuler à la mission
            </h2>
            <button type="button" onClick={onClose}>
              <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* CONTENU */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Lettre de motivation */}
            <div>
              <label htmlFor="coverLetter" className="block font-semibold mb-1">
                Lettre de motivation *
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows="5"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Expliquez pourquoi vous êtes le candidat idéal..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {coverLetter.length}/50 caractères minimum
              </p>
            </div>

            {/* Fichiers joints */}
            <div>
              <label htmlFor="file-upload" className="block font-semibold mb-1">
                Pièces jointes (CV, portfolio, etc.)
              </label>
              <input
                type="file"
                id="file-upload"
                name="attachments"
                multiple
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {attachments.length > 0 && (
                <div className="mt-3 text-sm text-gray-700">
                  <p className="font-medium">Fichiers sélectionnés :</p>
                  <ul className="list-disc list-inside">
                    {attachments.map((file, index) => (
                      <li key={index}>
                        {file.name} ({(file.size / 1024).toFixed(1)} Ko)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-4 p-6 bg-gray-50 border-t rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading
                ? `Envoi en cours... ${
                    uploadProgress > 0 ? `${uploadProgress}%` : ""
                  }`
                : "Envoyer ma candidature"}
            </button>
          </div>
          {/* --- NOUVEAU : LA BARRE DE PROGRESSION --- */}
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
