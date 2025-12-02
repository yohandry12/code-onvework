import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/api";
import {
  CheckIcon,
  XMarkIcon,
  StarIcon as StarSolid,
  TrashIcon,
  FunnelIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import toast from "react-hot-toast"; // Assurez-vous d'avoir react-hot-toast installé

const ManageTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'approved', 'featured'

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.testimonials.getAllForAdmin();
      if (
        response &&
        response.success &&
        Array.isArray(response.testimonials)
      ) {
        setTestimonials(response.testimonials);
      } else {
        setTestimonials([]);
      }
    } catch (err) {
      toast.error("Impossible de charger les témoignages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // --- LOGIQUE DE FILTRAGE ---
  useEffect(() => {
    let result = [...testimonials];
    if (filter === "pending") {
      result = result.filter((t) => !t.isApproved);
    } else if (filter === "approved") {
      result = result.filter((t) => t.isApproved);
    } else if (filter === "featured") {
      result = result.filter((t) => t.isFeatured);
    }
    setFilteredTestimonials(result);
  }, [testimonials, filter]);

  const handleUpdate = async (id, updates) => {
    try {
      // Optimistic update
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      await apiService.testimonials.updateStatus(id, updates);
      toast.success("Statut mis à jour !");
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Échec de la mise à jour.");
      fetchTestimonials();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce témoignage ?"))
      return;

    try {
      // Optimistic delete
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      await apiService.testimonials.delete(id);
      toast.success("Témoignage supprimé.");
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Erreur lors de la suppression.");
      fetchTestimonials();
    }
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
          Modération des Avis
        </h1>

        {/* --- BARRE DE FILTRES --- */}
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          {["all", "pending", "approved", "featured"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" && "Tous"}
              {f === "pending" && "En attente"}
              {f === "approved" && "Approuvés"}
              {f === "featured" && "À la une"}
            </button>
          ))}
        </div>
      </div>

      {/* COMPTEUR */}
      <div className="mb-4 text-sm text-gray-500">
        Affichage de{" "}
        <span className="font-bold text-gray-900">
          {filteredTestimonials.length}
        </span>{" "}
        témoignage(s).
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Auteur
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                  Contenu
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
              {filteredTestimonials.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-12 text-gray-400 italic"
                  >
                    Aucun témoignage ne correspond à ce filtre.
                  </td>
                </tr>
              ) : (
                filteredTestimonials.map((testimonial) => (
                  <tr
                    key={testimonial.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {`${testimonial.author?.profile?.firstName} ${testimonial.author?.profile?.lastName}` ||
                          "Utilisateur inconnu"}
                      </div>
                      <div className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
                        {testimonial.author?.role === "client"
                          ? "Recruteur"
                          : "Freelance"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 italic leading-relaxed line-clamp-3">
                        "{testimonial.content}"
                      </p>
                      {/* --- NOUVEAU BLOC ÉTOILES --- */}
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <StarSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < (testimonial.rating || 5)
                                ? "text-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-gray-500 font-medium">
                          {testimonial.rating || 5}/5
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {new Date(testimonial.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {testimonial.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckIcon className="w-3 h-3" /> Approuvé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <ClockIcon className="w-3 h-3" /> En attente
                          </span>
                        )}
                        {testimonial.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            <StarSolid className="w-3 h-3" /> À la une
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* APPROUVER / DÉSAPPROUVER */}
                        <button
                          onClick={() =>
                            handleUpdate(testimonial.id, {
                              isApproved: !testimonial.isApproved,
                            })
                          }
                          title={
                            testimonial.isApproved
                              ? "Masquer (Désapprouver)"
                              : "Publier (Approuver)"
                          }
                          className={`p-2 rounded-lg transition-colors border ${
                            testimonial.isApproved
                              ? "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              : "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {testimonial.isApproved ? (
                            <XMarkIcon className="h-5 w-5" />
                          ) : (
                            <CheckIcon className="h-5 w-5" />
                          )}
                        </button>

                        {/* METTRE À LA UNE */}
                        <button
                          onClick={() =>
                            handleUpdate(testimonial.id, {
                              isFeatured: !testimonial.isFeatured,
                            })
                          }
                          title={
                            testimonial.isFeatured
                              ? "Retirer de la une"
                              : "Mettre à la une"
                          }
                          className={`p-2 rounded-lg transition-colors border ${
                            testimonial.isFeatured
                              ? "bg-purple-50 border-purple-200 text-purple-600"
                              : "bg-white border-gray-300 text-gray-400 hover:text-yellow-500 hover:border-yellow-300"
                          }`}
                        >
                          {testimonial.isFeatured ? (
                            <StarSolid className="h-5 w-5" />
                          ) : (
                            <StarOutline className="h-5 w-5" />
                          )}
                        </button>

                        {/* SUPPRIMER */}
                        <button
                          onClick={() => handleDelete(testimonial.id)}
                          title="Supprimer définitivement"
                          className="p-2 rounded-lg bg-white border border-gray-300 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
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

// Petit helper pour l'icône Clock qui manquait dans les imports
const ClockIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
      clipRule="evenodd"
    />
  </svg>
);

export default ManageTestimonials;
