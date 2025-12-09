import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  BriefcaseIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";

const JobProposalModal = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedJobId, setSelectedJobId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Charger les missions actives du client
  useEffect(() => {
    if (isOpen) {
      const fetchMyJobs = async () => {
        try {
          setLoadingJobs(true);
          // On récupère les jobs du client. On filtre localement ou via l'API ceux qui sont 'published'
          // Assurez-vous que votre API supporte ?status=published
          const response = await apiService.jobs.getMyJobs({
            status: "published",
            limit: 100,
          });
          if (response.success) {
            setJobs(response.jobs || []);
          }
        } catch (err) {
          console.error("Erreur chargement jobs:", err);
          setError("Impossible de charger vos missions.");
        } finally {
          setLoadingJobs(false);
        }
      };
      fetchMyJobs();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobId) {
      setError("Veuillez sélectionner une mission.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Appel à la route backend créée précédemment
      // POST /api/jobs/:jobId/recruit/:candidateId
      const response = await apiService.post(
        `/jobs/${selectedJobId}/recruit/${candidate.id}`,
        {
          message,
        }
      );

      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Une erreur est survenue lors de l'envoi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-indigo-600" />
                Proposer une mission
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-full transition"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Info Candidat */}
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  {candidate.profile?.firstName?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-indigo-900 font-medium">
                    Vous proposez une mission à :
                  </p>
                  <p className="text-base font-bold text-indigo-800">
                    {candidate.profile?.firstName} {candidate.profile?.lastName}
                  </p>
                </div>
              </div>

              {/* Sélection Mission */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Choisir la mission *
                </label>
                {loadingJobs ? (
                  <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                ) : jobs.length === 0 ? (
                  <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                    Aucune mission active trouvée. <br />
                    <a
                      href="/jobs/create"
                      className="text-indigo-600 hover:underline"
                    >
                      Publiez une offre d'abord
                    </a>
                    .
                  </div>
                ) : (
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    required
                  >
                    <option value="">-- Sélectionner une mission --</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message personnalisé
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, votre profil m'intéresse beaucoup pour cette mission..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  Optionnel mais recommandé
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || jobs.length === 0 || !selectedJobId}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : (
                    <>
                      Envoyer la proposition{" "}
                      <CheckCircleIcon className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JobProposalModal;
