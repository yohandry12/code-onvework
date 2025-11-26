import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "../../services/api";

export default function MissionApprovalModal({
  isOpen,
  onClose,
  applicationId,
  jobId,
  jobTitle,
  candidateName,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Mettre à jour le statut de la candidature à "completed"
      // Note: Votre backend s'occupe déjà de passer le Job en "filled" automatiquement
      // quand la candidature passe en "completed". Pas besoin de faire un 2ème appel API.
      const response = await apiService.applications.updateStatus(
        applicationId,
        "completed"
      );

      // Avec Axios/apiService, si on est ici, c'est que ça a marché.
      // On vérifie juste la propriété success logique du backend
      if (response && response.success) {
        // Déclencher le succès (ce qui ouvrira la modale de recommandation dans le parent)
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error("Réponse inattendue du serveur.");
      }
    } catch (err) {
      console.error("Erreur validation:", err);
      // Gestion correcte des erreurs Axios
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erreur lors de la validation";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Valider l'achèvement de la mission
              </h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Confirmez que vous acceptez l'achèvement de la mission :
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="font-semibold text-indigo-900">{jobTitle}</p>
                  </div>
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Candidat :</span>{" "}
                      {candidateName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Une fois approuvée, cette mission sera archivée et vous
                  pourrez laisser une recommandation au candidat.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "En cours..." : "Approuver"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
