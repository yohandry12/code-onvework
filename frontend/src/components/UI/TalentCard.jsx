import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  BriefcaseIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { apiService } from "../../services/api";

// --- FONCTION UTILITAIRE POUR L'AVATAR ---
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  const baseUrl = apiUrl.replace(/\/api$/, "");
  const cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;

  return `${baseUrl}${cleanPath}`;
};

const TalentCard = ({ talent }) => {
  const navigate = useNavigate();

  // États pour les avis
  const [stats, setStats] = useState({ average: 0, count: 0, loading: true });

  // --- NOUVEAU : État pour synchroniser le nombre de missions ---
  const profileData = talent?.profile || talent?.candidateProfile || {};
  const [jobCount, setJobCount] = useState(profileData.completedJobs || 0);

  if (!talent) {
    return null;
  }

  const fullName =
    profileData.fullName ||
    (profileData.firstName && profileData.lastName
      ? `${profileData.firstName} ${profileData.lastName}`
      : profileData.firstName || profileData.lastName || "Utilisateur");

  // --- RECUPERATION DES DONNÉES FRAÎCHES (Avis + Profil Complet) ---
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const candidateId = talent.id || talent.userId;
        if (!candidateId) return;

        // On lance les deux requêtes en parallèle
        const [recommendationsRes, profileRes] = await Promise.allSettled([
          apiService.recommendations.getCandidateRecommendations(candidateId),
          apiService.users.getProfile(candidateId),
        ]);

        if (!isMounted) return;

        // 1. Traitement des Recommandations (Avis)
        if (
          recommendationsRes.status === "fulfilled" &&
          recommendationsRes.value.success
        ) {
          const { averageRating, totalRecommendations } =
            recommendationsRes.value.data;
          setStats({
            average: Number(averageRating) || 0,
            count: Number(totalRecommendations) || 0,
            loading: false,
          });
        } else {
          setStats((prev) => ({ ...prev, loading: false }));
        }

        // 2. Traitement du Profil (Missions Complétées)
        if (profileRes.status === "fulfilled" && profileRes.value.success) {
          const freshProfile = profileRes.value.user.profile;
          // Si le backend renvoie bien completedJobs, on met à jour
          if (freshProfile && freshProfile.completedJobs !== undefined) {
            setJobCount(freshProfile.completedJobs);
          }
        }
      } catch (error) {
        console.error("Erreur chargement données talent", error);
        if (isMounted) setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [talent]);

  // Fonction étoiles
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

  const avatarSrc = profileData.avatar
    ? getAvatarUrl(profileData.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  const skills =
    Array.isArray(profileData.skills) && profileData.skills.length > 0
      ? profileData.skills.slice(0, 2).join(" • ")
      : "Aucune compétence listée";

  return (
    <div
      onClick={() => navigate(`/talents/${talent.id || talent.userId}`)}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
    >
      {/* Bouton Options (Placeholder) */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        onClick={(e) => {
          e.stopPropagation();
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

      {/* Étoiles */}
      <div className="flex items-center gap-2 mt-1 mb-2 h-6">
        {stats.loading ? (
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

      {/* Nom & Lieu */}
      <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
      {profileData.location?.city && (
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span>{profileData.location.city}</span>
        </div>
      )}

      {/* Profession */}
      {profileData.profession && (
        <p className="text-sm text-gray-600 mt-2 font-medium">
          {profileData.profession}
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

      {/* Nombre de missions complétées (SYNCHRONISÉ) */}
      <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
        {jobCount} mission{jobCount !== 1 ? "s" : ""} complétée
        {jobCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default TalentCard;
