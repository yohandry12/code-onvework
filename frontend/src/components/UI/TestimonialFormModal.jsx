import React, { useState } from "react";
import { apiService } from "../../services/api";
import { XMarkIcon } from "@heroicons/react/24/outline";

const TestimonialFormModal = ({ onClose, onSubmitted }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.length < 20) {
      setError("Votre témoignage doit faire au moins 20 caractères.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await apiService.testimonials.create({ content });
      setSuccess(response.message || "Témoignage envoyé !");
      // On attend un peu pour que l'utilisateur voie le message de succès, puis on ferme.
      setTimeout(() => {
        onSubmitted(); // Appelle la fonction parente pour fermer et afficher une alerte globale si besoin
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Partagez votre expérience
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
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
              <div className="p-6">
                <label
                  htmlFor="testimonial-content"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Votre avis sur la plateforme :
                </label>
                <textarea
                  id="testimonial-content"
                  rows="5"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Cette plateforme m'a aidé à trouver des missions passionnantes..."
                />
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>
              <div className="flex justify-end gap-4 p-4 bg-gray-50 border-t rounded-b-xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default TestimonialFormModal;
