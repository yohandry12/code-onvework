// import React, { useEffect } from "react";
// import {
//   XIcon,
//   MailIcon,
//   PhoneIcon,
//   LocationMarkerIcon,
//   AcademicCapIcon,
//   SparklesIcon,
// } from "@heroicons/react/outline";

// const InfoRow = ({ icon, label, value }) => (
//   <div className="flex items-start text-left">
//     <div className="flex-shrink-0 w-6 h-6 text-gray-500">{icon}</div>
//     <div className="ml-3">
//       <p className="text-sm font-medium text-gray-500">{label}</p>
//       <p className="text-sm text-gray-900">{value || "Non renseigné"}</p>
//     </div>
//   </div>
// );

// const RecommendationBadge = ({ badge }) => {
//   if (!badge || badge === "Aucun") {
//     return null; // N'affiche rien si pas de badge
//   }

//   const badgeStyles = {
//     Bronze: "bg-orange-100 text-orange-800",
//     Argent: "bg-gray-200 text-gray-800",
//     Or: "bg-yellow-100 text-yellow-800",
//   };

//   const style = badgeStyles[badge] || badgeStyles.Bronze;

//   return (
//     <div className="border-t pt-4">
//       <h3 className="font-semibold text-gray-800 mb-2">Recommandation</h3>
//       <div
//         className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${style}`}
//       >
//         <SparklesIcon className="h-5 w-5" />
//         <span>Badge {badge}</span>
//       </div>
//     </div>
//   );
// };

// // Le composant reçoit l'objet 'freelancer' complet directement en prop
// const FreelancerProfileModal = ({ freelancer, onClose }) => {
//   // Effet pour gérer la fermeture avec la touche "Echap"
//   useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.keyCode === 27) onClose();
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [onClose]);

//   // Si pas de freelancer, on n'affiche rien.
//   if (!freelancer) return null;

//   const fullName =
//     freelancer.profile.fullName ||
//     `${freelancer.profile.firstName} ${freelancer.profile.lastName}`;
//   return (
//     <div
//       className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl text-gray-900"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Il n'y a plus d'état de chargement ou d'erreur */}
//         <>
//           <div className="p-6 border-b flex items-start justify-between">
//             <div className="flex items-center space-x-4">
//               <img
//                 src={
//                   freelancer.profile.avatar ||
//                   `https://ui-avatars.com/api/?name=${encodeURIComponent(
//                     fullName
//                   )}`
//                 }
//                 alt={fullName}
//                 className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
//               />
//               <div>
//                 <h2 className="text-2xl font-bold">{fullName}</h2>
//                 <p className="text-gray-600">{freelancer.profile.profession}</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
//             >
//               <XIcon className="h-6 w-6" />
//             </button>
//           </div>

//           <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
//             {/* Colonne de gauche */}
//             <div className="space-y-6">
//               <h3 className="font-semibold">Biographie</h3>
//               <p className="text-sm text-gray-600 leading-relaxed">
//                 {freelancer.profile.bio || "Aucune biographie."}
//               </p>
//               <h3 className="font-semibold mb-2 text-gray-800">Compétences</h3>
//               <div className="flex flex-wrap gap-2">
//                 {freelancer.profile.skills?.length > 0 ? (
//                   freelancer.profile.skills.map((skill, idx) => (
//                     <span
//                       key={idx}
//                       className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-blue-50 to-indigo-50
//                    text-blue-700 font-medium border border-blue-200 shadow-sm
//                    hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300
//                    transition-colors duration-200"
//                     >
//                       {skill}
//                     </span>
//                   ))
//                 ) : (
//                   <p className="text-sm text-gray-500">Aucune compétence.</p>
//                 )}
//               </div>
//             </div>

//             {/* Colonne de droite */}
//             <div className="space-y-6">
//               <h3 className="font-semibold">Informations</h3>
//               <InfoRow
//                 icon={<MailIcon />}
//                 label="Email"
//                 value={freelancer.email}
//               />
//               <InfoRow
//                 icon={<PhoneIcon />}
//                 label="Téléphone"
//                 value={freelancer.profile.phone}
//               />
//               <InfoRow
//                 icon={<LocationMarkerIcon />}
//                 label="Localisation"
//                 value={`${freelancer.profile.location?.city}, ${freelancer.profile.location?.country}`}
//               />
//               <div className="border-t pt-4">
//                 <h3 className="font-semibold text-gray-800 mb-2">Diplômes</h3>
//                 {freelancer.profile.diplomas?.length > 0 ? (
//                   freelancer.profile.diplomas.map((diploma, idx) => (
//                     <div
//                       key={idx}
//                       className="flex items-center text-sm text-gray-700"
//                     >
//                       <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-400" />
//                       <span>{diploma.type}</span>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-sm text-gray-500">Aucun diplôme.</p>
//                 )}
//               </div>

//               <RecommendationBadge
//                 badge={freelancer.profile.recommendationBadge}
//               />
//             </div>
//           </div>
//         </>
//       </div>
//     </div>
//   );
// };

// export default FreelancerProfileModal;
// src/components/UI/FreelancerProfileModal.jsx

import React, { useEffect } from "react";
import {
  XMarkIcon as XIcon, // remplace XIcon (v1) par XMarkIcon (v2)
  EnvelopeIcon as MailIcon, // remplace MailIcon (v1) par EnvelopeIcon (v2)
  PhoneIcon, // PhoneIcon existe en v2, pas besoin d'alias
  MapPinIcon as LocationMarkerIcon, // MapPinIcon (v2) -> LocationMarkerIcon (alias)
  AcademicCapIcon, // identique en v2
  SparklesIcon, // identique en v2
} from "@heroicons/react/24/outline";

// --- Composant d'aide pour afficher une ligne d'information ---
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start text-left">
    <div className="flex-shrink-0 w-6 h-6 text-gray-400">{icon}</div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-800">{value || "Non renseigné"}</p>
    </div>
  </div>
);

// --- Composant d'aide pour afficher le badge de recommandation ---
const RecommendationBadge = ({ badge }) => {
  if (!badge || badge === "Aucun") {
    return null;
  }

  const badgeStyles = {
    Bronze: "bg-orange-100 text-orange-800",
    Argent: "bg-gray-200 text-gray-800",
    Or: "bg-yellow-100 text-yellow-800",
  };

  const style = badgeStyles[badge] || badgeStyles.Bronze;

  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-gray-800 mb-2">Recommandation</h3>
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${style}`}
      >
        <SparklesIcon className="h-5 w-5" />
        <span>Badge {badge}</span>
      </div>
    </div>
  );
};

// --- Composant principal de la modale ---
const FreelancerProfileModal = ({ freelancer, isLoading, onClose }) => {
  // Gère la fermeture avec la touche "Echap"
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!freelancer) return null;

  // --- FONCTION UTILITAIRE POUR L'AVATAR ---
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;

    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = apiUrl.replace(/\/api$/, "");
    const cleanPath = avatarPath.startsWith("/")
      ? avatarPath
      : `/${avatarPath}`;

    return `${baseUrl}${cleanPath}`;
  };

  // Construit le nom complet de manière robuste
  const fullName =
    freelancer.profile.fullName ||
    `${freelancer.profile.firstName} ${freelancer.profile.lastName}`;

  // Avatar avec fallback
  const avatarSrc = freelancer.profile.avatar
    ? getAvatarUrl(freelancer.profile.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  const completedJobs = freelancer.profile?.completedJobs ?? 0;

  return (
    // L'arrière-plan semi-transparent qui ferme la modale au clic
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl text-gray-900 transform transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique dans la modale
      >
        {/* --- ÉTAT DE CHARGEMENT --- */}
        {isLoading ? (
          <div className="h-[70vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          /* --- CONTENU DU PROFIL --- */
          <>
            {/* En-tête */}
            <div className="p-6 border-b flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={avatarSrc}
                  alt={fullName}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm bg-gray-100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      fullName
                    )}&background=random&color=fff`;
                  }}
                />
                <div>
                  <h2 className="text-2xl font-bold">{fullName}</h2>
                  <p className="text-gray-600 font-medium">
                    {freelancer.profile.profession}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Corps de la modale */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
              {/* Colonne de gauche */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Biographie</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {freelancer.profile.bio ||
                    "Aucune biographie n'a été renseignée."}
                </p>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">
                  Compétences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {freelancer.profile.skills?.length > 0 ? (
                    freelancer.profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-800 font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aucune compétence listée.
                    </p>
                  )}
                </div>

                {/* Nombre de missions complétées */}
                <div className="flex items-center  mt-4">
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold tracking-wide">
                    {completedJobs} mission{completedJobs !== 1 ? "s" : ""}{" "}
                    complétée{completedJobs !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Colonne de droite */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Informations</h3>
                <InfoRow
                  icon={<MailIcon />}
                  label="Email"
                  value={freelancer.email}
                />
                <InfoRow
                  icon={<PhoneIcon />}
                  label="Téléphone"
                  value={freelancer.profile.phone}
                />
                <InfoRow
                  icon={<LocationMarkerIcon />}
                  label="Localisation"
                  value={`${freelancer.profile.location?.city}, ${freelancer.profile.location?.country}`}
                />

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Diplômes</h3>
                  {freelancer.profile.diplomas?.length > 0 ? (
                    <ul className="space-y-2">
                      {freelancer.profile.diplomas.map((diploma, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-sm text-gray-700"
                        >
                          <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-400" />
                          <span>{diploma.type}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Aucun diplôme renseigné.
                    </p>
                  )}
                </div>

                <RecommendationBadge
                  badge={freelancer.profile.recommendationBadge}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FreelancerProfileModal;
