import React, { useState, useMemo } from "react";
import { apiService } from "../services/api";
import {
  XMarkIcon,
  PaperClipIcon,
  ExclamationCircleIcon,
  CalculatorIcon,
  BanknotesIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

// On ajoute la prop 'budget' qui contient { min, max, currency }
const ApplicationForm = ({ jobId, budget, onClose, onSubmitted }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- CALCUL DE LA RÉPARTITION (70/20/10) ---
  const calculations = useMemo(() => {
    if (!budget || !budget.min || !budget.max) return null;

    // On se base sur la moyenne du budget pour l'estimation
    // Note: Vous pouvez changer ça pour prendre le budget.min si vous préférez être prudent
    const amount = (parseFloat(budget.min) + parseFloat(budget.max)) / 2;

    return {
      total: amount,
      candidate: amount * 0.7, // 70%
      training: amount * 0.2, // 20%
      platform: amount * 0.1, // 10%
      currency: budget.currency || "EUR",
    };
  }, [budget]);

  // --- GESTION DES FICHIERS ---
  const handleFileChange = (e) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    setAttachments(selectedFiles);
    if (selectedFiles.length > 0) setError("");
  };

  // --- VALIDATION ---
  const validateForm = () => {
    if (coverLetter.trim().length < 50) {
      setError(
        "Votre lettre de motivation doit contenir au moins 50 caractères."
      );
      return false;
    }
    if (attachments.length === 0) {
      setError(
        "Vous devez obligatoirement joindre un fichier (CV, Portfolio...)."
      );
      return false;
    }
    setError("");
    return true;
  };

  // --- ENVOI ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
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
        config
      );
      onSubmitted();
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError(
          "L'envoi a pris trop de temps. Réessayez avec des fichiers plus petits."
        );
      } else {
        setError(err.response?.data?.error || "Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">
            Postuler à la mission
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* --- NOUVEAU BLOC : SIMULATION FINANCIÈRE --- */}
          {calculations && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
              <h3 className="text-md font-bold text-indigo-900 flex items-center gap-2 mb-4">
                <CalculatorIcon className="w-5 h-5" />
                Répartition estimée des gains (Moyenne)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 70% CANDIDAT */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    70%
                  </div>
                  <BanknotesIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Votre Gain Net
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {calculations.candidate.toLocaleString("fr-FR")}{" "}
                    {calculations.currency}
                  </p>
                </div>

                {/* 20% FORMATION */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    20%
                  </div>
                  <AcademicCapIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Fonds Formation
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {calculations.training.toLocaleString("fr-FR")}{" "}
                    {calculations.currency}
                  </p>
                </div>

                {/* 10% EMPLOYEUR */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center relative overflow-hidden opacity-75">
                  <div className="absolute top-0 right-0 bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    10%
                  </div>
                  <BuildingLibraryIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium uppercase">
                    Frais Service
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    {calculations.platform.toLocaleString("fr-FR")}{" "}
                    {calculations.currency}
                  </p>
                </div>
              </div>
              <p className="text-xs text-indigo-400 mt-3 text-center italic">
                * Calcul basé sur la moyenne du budget annoncé ({budget.min} -{" "}
                {budget.max} {budget.currency}).
              </p>
            </div>
          )}
          {/* ------------------------------------------- */}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-start gap-2">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form id="applyForm" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="coverLetter"
                className="block font-semibold text-gray-700 mb-2"
              >
                Lettre de motivation <span className="text-red-500">*</span>
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows="5"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
                placeholder="Pourquoi êtes-vous le candidat idéal ?"
                required
              />
              <p
                className={`text-xs mt-1 text-right ${
                  coverLetter.length < 50 ? "text-orange-500" : "text-green-600"
                }`}
              >
                {coverLetter.length}/50 caractères min.
              </p>
            </div>

            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <label
                htmlFor="file-upload"
                className="block font-semibold text-blue-900 mb-2 flex items-center gap-2"
              >
                <PaperClipIcon className="w-5 h-5" />
                Pièces jointes <span className="text-red-500">*</span>{" "}
                <span className="text-xs font-normal text-blue-600">
                  (CV requis)
                </span>
              </label>
              <p className="text-sm text-blue-700 mb-3">
                CV, Portfolio ou tout document pertinent.
              </p>
              <input
                type="file"
                id="file-upload"
                name="attachments"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-blue-700 file:ring-1 file:ring-blue-200 hover:file:bg-blue-50 cursor-pointer"
              />
              {attachments.length > 0 && (
                <div className="mt-4 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                  <ul className="space-y-1">
                    {attachments.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span className="truncate max-w-xs">{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-gray-50 border-t shrink-0">
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="applyForm"
              disabled={loading}
              className="px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi..." : "Confirmer et Postuler"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
