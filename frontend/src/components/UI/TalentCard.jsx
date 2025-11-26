import React, { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  BriefcaseIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { apiService } from "../../services/api";
// Un petit utilitaire pour obtenir les codes de pays pour les drapeaux
// const getCountryCode = (countryName) => {
//   const countryMap = {
//     Germany: "DE",
//     Australia: "AU",
//     Brazil: "BR",
//     Singapore: "SG",
//     France: "FR",
//     Canada: "CA",
//     "United States": "US",
//     "United Kingdom": "GB",
//     Italy: "IT",
//     Spain: "ES",
//     Netherlands: "NL",
//   };
//   return countryMap[countryName] || null;
// };

// --- FONCTION UTILITAIRE POUR L'AVATAR ---
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const apiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = apiUrl.replace(/\/api$/, "");
  const cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;

  return `${baseUrl}${cleanPath}`;
};

const TalentCard = ({ talent, onViewProfile }) => {
  // --- NOUVEAU : États pour stocker les avis ---
  const [stats, setStats] = useState({ average: 0, count: 0, loading: true });

  // ✅ AJOUT DE VÉRIFICATIONS DE SÉCURITÉ
  if (!talent) {
    return null; // ou un skeleton loader
  }

  // Extraire le profil avec un fallback sur un objet vide
  const profile = talent.profile || talent.candidateProfile || {};

  // Vérifications de sécurité pour toutes les propriétés
  // const countryCode = profile.location?.country
  //   ? getCountryCode(profile.location.country)
  //   : null;
  const completedJobs = profile.completedJobs ?? 0;

  // Construction du nom complet avec plusieurs fallbacks
  const fullName =
    profile.fullName ||
    (profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.firstName || profile.lastName || "Utilisateur");

  // --- NOUVEAU : Récupération et calcul des notes ---
  useEffect(() => {
    let isMounted = true;

    const fetchRating = async () => {
      try {
        // L'ID du talent correspond à son userId
        const candidateId = talent.id || talent.userId;

        if (!candidateId) return;

        const response =
          await apiService.recommendations.getCandidateRecommendations(
            candidateId
          );

        if (response.success && response.data) {
          // LE FIX EST ICI : On récupère directement les stats envoyées par le backend
          // au lieu de les recalculer
          const { averageRating, totalRecommendations } = response.data;

          if (isMounted) {
            setStats({
              average: Number(averageRating) || 0, // S'assure que c'est un nombre
              count: Number(totalRecommendations) || 0,
              loading: false,
            });
          }
        } else {
          if (isMounted) setStats({ average: 0, count: 0, loading: false });
        }
      } catch (error) {
        console.error("Erreur chargement note", error);
        if (isMounted) setStats({ average: 0, count: 0, loading: false });
      }
    };

    fetchRating();

    return () => {
      isMounted = false;
    };
  }, [talent]);

  // --- NOUVEAU : Fonction pour afficher les étoiles ---
  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  // Avatar avec fallback
  const avatarSrc = profile.avatar
    ? getAvatarUrl(profile.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  // Compétences avec vérification
  const skills =
    Array.isArray(profile.skills) && profile.skills.length > 0
      ? profile.skills.slice(0, 2).join(" • ")
      : "Aucune compétence listée";

  return (
    <div
      onClick={onViewProfile}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
    >
      {/* Bouton Options */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        onClick={(e) => {
          e.stopPropagation(); // Empêcher de déclencher onViewProfile
          // Ajouter la logique du menu options ici
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Avatar */}
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

      {/* --- NOUVEAU : Affichage des étoiles sous le nom --- */}
      <div className="flex items-center gap-2 mt-1 mb-2 h-6">
        {stats.loading ? (
          // Petit squelette de chargement discret
          <div className="h-4 w-24 bg-gray-100 animate-pulse rounded"></div>
        ) : stats.count > 0 ? (
          <>
            {renderStars(stats.average)}
            <span className="text-sm text-gray-500 font-medium">
              ({stats.count} avis)
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-400 italic">Aucun avis</span>
        )}
      </div>

      {/* Nom et Localisation */}
      <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
      {profile.location?.city && (
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span>{profile.location.city}</span>
        </div>
      )}

      {/* Profession (si disponible) */}
      {profile.profession && (
        <p className="text-sm text-gray-600 mt-2 font-medium">
          {profile.profession}
        </p>
      )}

      {/* Compétences */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
        <BriefcaseIcon className="w-5 h-5 text-gray-400" />
        <p className="line-clamp-1">{skills}</p>
      </div>

      {/* Email */}
      {talent.email && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
          <EnvelopeIcon className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600 truncate max-w-[200px]">
            {talent.email}
          </span>
        </div>
      )}

      {/* Nombre de missions complétées */}
      <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
        {completedJobs} mission{completedJobs !== 1 ? "s" : ""} complétée
        {completedJobs !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default TalentCard;
