// import React, { useState, useEffect, useCallback } from "react";
// import { apiService } from "../../services/api";
// import {
//   CheckIcon,
//   XIcon,
//   StarIcon as StarSolid,
// } from "@heroicons/react/solid";
// import { StarIcon as StarOutline } from "@heroicons/react/outline";

// const ManageTestimonials = () => {
//   const [testimonials, setTestimonials] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchTestimonials = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await apiService.testimonials.getAllForAdmin();
//       setTestimonials(data);
//     } catch (err) {
//       setError("Impossible de charger les témoignages.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchTestimonials();
//   }, [fetchTestimonials]);

//   const handleUpdate = async (id, updates) => {
//     try {
//       // Optimistic update: met à jour l'UI avant même que l'API réponde
//       setTestimonials((prev) =>
//         prev.map((t) => (t._id === id ? { ...t, ...updates } : t))
//       );
//       await apiService.testimonials.updateStatus(id, updates);
//     } catch (err) {
//       console.error("Erreur de mise à jour:", err);
//       // Si l'API échoue, on pourrait revenir en arrière (rollback)
//       alert("La mise à jour a échoué.");
//       fetchTestimonials(); // On recharge les données pour être sûr
//     }
//   };

//   if (loading) return <div className="text-center p-8">Chargement...</div>;
//   if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">
//         Gestion des Témoignages
//       </h1>

//       <div className="bg-white shadow-md rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                 Auteur
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                 Contenu
//               </th>
//               <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
//                 Statut
//               </th>
//               <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {testimonials.map((testimonial) => (
//               <tr key={testimonial._id}>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm font-medium text-gray-900">
//                     {testimonial.author?.profile?.firstName}
//                   </div>
//                   <div className="text-sm text-gray-500">
//                     {testimonial.author?.role}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4">
//                   <p className="text-sm text-gray-700 max-w-md">
//                     {testimonial.content}
//                   </p>
//                 </td>
//                 <td className="px-6 py-4 text-center">
//                   {testimonial.isApproved ? (
//                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                       Approuvé
//                     </span>
//                   ) : (
//                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
//                       En attente
//                     </span>
//                   )}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
//                   {/* Bouton Approuver/Désapprouver */}
//                   <button
//                     onClick={() =>
//                       handleUpdate(testimonial._id, {
//                         isApproved: !testimonial.isApproved,
//                       })
//                     }
//                     title={
//                       testimonial.isApproved ? "Désapprouver" : "Approuver"
//                     }
//                     className={`p-2 rounded-full ${
//                       testimonial.isApproved
//                         ? "bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600"
//                         : "bg-gray-100 hover:bg-green-100 hover:text-green-600"
//                     }`}
//                   >
//                     {testimonial.isApproved ? (
//                       <XIcon className="h-5 w-5" />
//                     ) : (
//                       <CheckIcon className="h-5 w-5" />
//                     )}
//                   </button>

//                   {/* Bouton Mettre en avant */}
//                   <button
//                     onClick={() =>
//                       handleUpdate(testimonial._id, {
//                         isFeatured: !testimonial.isFeatured,
//                       })
//                     }
//                     title={
//                       testimonial.isFeatured
//                         ? "Retirer de la une"
//                         : "Mettre en avant"
//                     }
//                     className={`p-2 rounded-full ${
//                       testimonial.isFeatured
//                         ? "text-yellow-500 bg-yellow-100"
//                         : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-100"
//                     }`}
//                   >
//                     {testimonial.isFeatured ? (
//                       <StarSolid className="h-5 w-5" />
//                     ) : (
//                       <StarOutline className="h-5 w-5" />
//                     )}
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default ManageTestimonials;

import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/api";

// --- IMPORTS DES ICÔNES ---
// On importe depuis 'solid' pour les icônes pleines
import {
  CheckIcon,
  XMarkIcon,
  StarIcon as StarSolid,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
// On importe depuis 'outline' pour les icônes creuses
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

const ManageTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiService.testimonials.getAllForAdmin();

      // --- CORRECTION CLÉ : On extrait le tableau de la réponse ---
      if (
        response &&
        response.success &&
        Array.isArray(response.testimonials)
      ) {
        setTestimonials(response.testimonials);
      } else {
        console.error("Format de réponse inattendu:", response);
        setTestimonials([]); // Assure que c'est toujours un tableau
      }
    } catch (err) {
      setError("Impossible de charger les témoignages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleUpdate = async (id, updates) => {
    try {
      // --- CORRECTION : Utiliser 'id' au lieu de '_id' ---
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      await apiService.testimonials.updateStatus(id, updates);
    } catch (err) {
      console.error("Erreur de mise à jour:", err);
      alert("La mise à jour a échoué. Rechargement des données.");
      fetchTestimonials();
    }
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* --- EN-TÊTE AVEC LA BULLE D'INFORMATION --- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestion des Témoignages
        </h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Auteur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contenu
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  Aucun témoignage n'a encore été soumis.
                </td>
              </tr>
            ) : (
              testimonials.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {`${testimonial.author?.profile?.firstName} ${testimonial.author?.profile?.lastName}` ||
                        "Utilisateur supprimé"}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {testimonial.author?.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 max-w-md">
                      {testimonial.content}
                    </p>
                  </td>

                  {/* --- AFFICHAGE AMÉLIORÉ DU STATUT --- */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {testimonial.isApproved ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approuvé
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      )}
                      {testimonial.isFeatured && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Mis en avant
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button
                      onClick={() =>
                        handleUpdate(testimonial.id, {
                          isApproved: !testimonial.isApproved,
                        })
                      }
                      title={
                        testimonial.isApproved ? "Désapprouver" : "Approuver"
                      }
                      className={`p-2 rounded-full transition-colors ${
                        testimonial.isApproved
                          ? "bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600"
                          : "bg-gray-100 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      {testimonial.isApproved ? (
                        <XMarkIcon className="h-5 w-5" />
                      ) : (
                        <CheckIcon className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handleUpdate(testimonial.id, {
                          isFeatured: !testimonial.isFeatured,
                        })
                      }
                      title={
                        testimonial.isFeatured
                          ? "Retirer de la une"
                          : "Mettre en avant"
                      }
                      className={`p-2 rounded-full transition-colors ${
                        testimonial.isFeatured
                          ? "text-yellow-500 bg-yellow-100"
                          : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-100"
                      }`}
                    >
                      {testimonial.isFeatured ? (
                        <StarSolid className="h-5 w-5" />
                      ) : (
                        <StarOutline className="h-5 w-5" />
                      )}
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

export default ManageTestimonials;
