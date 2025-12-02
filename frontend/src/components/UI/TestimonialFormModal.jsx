import React, { useState } from "react";
import { apiService } from "../../services/api";
import {
  XMarkIcon,
  StarIcon as StarOutline,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid"; // <--- Import pour les étoiles pleines

const TestimonialFormModal = ({ onClose, onSubmitted }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.length < 20) {
      setError("Votre témoignage doit faire au moins 20 caractères.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await apiService.testimonials.create({
        content,
        rating,
      });
      setSuccess(response.message || "Témoignage envoyé !");
      // On attend un peu pour que l'utilisateur voie le message de succès, puis on ferme.
      setTimeout(() => {
        onSubmitted("success"); // Appelle la fonction parente pour fermer et afficher une alerte globale si besoin
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue.");
      setLoading(false);
      onSubmitted("error"); //Renvoyer une toast d'erreur en cas d'erreur
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
              <div className="p-6 space-y-4">
                {/* --- SÉLECTEUR D'ÉTOILES --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre note :
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        {star <= (hoverRating || rating) ? (
                          <StarIcon className="w-8 h-8 text-yellow-400" />
                        ) : (
                          <StarOutline className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                        )}
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500 font-medium">
                      ({rating}/5)
                    </span>
                  </div>
                </div>

                {/* CHAMP TEXTE */}
                <div>
                  <label
                    htmlFor="testimonial-content"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Votre avis sur la plateforme :
                  </label>
                  <textarea
                    id="testimonial-content"
                    rows="4"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Ex: Cette plateforme m'a aidé à trouver des missions passionnantes..."
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t rounded-b-xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-medium shadow-sm"
                >
                  {loading ? "Envoi..." : "Envoyer mon avis"}
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
