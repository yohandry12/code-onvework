import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  BriefcaseIcon,
  MapPinIcon,
  AcademicCapIcon, // Pour Étudiant
  SparklesIcon, // Pour En recherche
  UserIcon, // Pour Freelance
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
  const [stats, setStats] = useState({ average: 0, count: 0, loading: true });

  // Données du profil
  const profileData = talent?.profile || talent?.candidateProfile || {};
  const [jobCount, setJobCount] = useState(profileData.completedJobs || 0);

  if (!talent) return null;

  const fullName =
    profileData.fullName ||
    (profileData.firstName && profileData.lastName
      ? `${profileData.firstName} ${profileData.lastName}`
      : "Utilisateur");

  // --- LOGIQUE DES BADGES DE STATUT ---
  const getStatusBadge = (type) => {
    switch (type) {
      case "student":
        return {
          label: "Étudiant",
          icon: <AcademicCapIcon className="w-3 h-3 mr-1" />,
          style: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "unemployed":
        return {
          label: "En recherche", // ou "Disponible"
          icon: <SparklesIcon className="w-3 h-3 mr-1" />,
          style: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "freelance":
      default:
        return {
          label: "Freelance",
          icon: <BriefcaseIcon className="w-3 h-3 mr-1" />,
          style: "bg-indigo-100 text-indigo-700 border-indigo-200",
        };
    }
  };

  const statusBadge = getStatusBadge(profileData.candidateType || "freelance");

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const candidateId = talent.id || talent.userId;
        if (!candidateId) return;

        const [recommendationsRes, profileRes] = await Promise.allSettled([
          apiService.recommendations.getCandidateRecommendations(candidateId),
          apiService.users.getProfile(candidateId),
        ]);

        if (!isMounted) return;

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

        if (profileRes.status === "fulfilled" && profileRes.value.success) {
          const freshProfile = profileRes.value.user.profile;
          if (freshProfile && freshProfile.completedJobs !== undefined) {
            setJobCount(freshProfile.completedJobs);
          }
        }
      } catch (error) {
        if (isMounted) setStats((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [talent]);

  const renderStars = (rating) => (
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

  const avatarSrc = profileData.avatar
    ? getAvatarUrl(profileData.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  const skills =
    Array.isArray(profileData.skills) && profileData.skills.length > 0
      ? profileData.skills.slice(0, 3).join(" • ")
      : "Aucune compétence listée";

  return (
    <div
      onClick={() => navigate(`/talents/${talent.id || talent.userId}`)}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer border border-gray-100"
    >
      {/* --- NOUVEAU : BADGE DE STATUT (Haut Gauche) --- */}
      <div
        className={`absolute top-4 left-4 flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge.style}`}
      >
        {statusBadge.icon}
        {statusBadge.label}
      </div>

      {/* Bouton Options (Haut Droite) */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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
        className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm bg-gray-50 mt-4" // mt-4 ajouté pour laisser place aux badges
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
      <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>

      {profileData.location?.city && (
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span>{profileData.location.city}</span>
        </div>
      )}

      {/* Profession */}
      {profileData.profession && (
        <p className="text-sm text-indigo-600 mt-2 font-semibold">
          {profileData.profession}
        </p>
      )}

      {/* Compétences */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-4 bg-gray-50 px-3 py-1.5 rounded-lg w-full justify-center">
        <BriefcaseIcon className="w-4 h-4 text-gray-400" />
        <p className="line-clamp-1 text-xs font-medium">{skills}</p>
      </div>

      {/* Email */}
      {talent.email && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
          <span className="truncate max-w-[200px] text-xs">{talent.email}</span>
        </div>
      )}

      {/* Footer : Missions complétées */}
      <div className="mt-5 w-full pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
          <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs">
            {jobCount} mission{jobCount > 1 ? "s" : ""}
          </span>
          <span className="text-gray-400 text-xs">
            réalisée{jobCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TalentCard;
