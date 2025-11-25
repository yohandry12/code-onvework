import React, { useState, useEffect } from "react";
import { EnvelopeIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid"; 
import { apiService } from "../services/api"; // Assure-toi que le chemin est correct

// Utilitaire pour les drapeaux (inchangé)
const getCountryCode = (countryName) => {
  const countryMap = {
    Germany: "DE", Australia: "AU", Brazil: "BR", Singapore: "SG",
    France: "FR", Canada: "CA", "United States": "US", "United Kingdom": "GB",
    Italy: "IT", Spain: "ES", Netherlands: "NL",
  };
  return countryMap[countryName] || null;
};

const TalentCard = ({ talent, onViewProfile }) => {
  const { profile } = talent;
  const countryCode = getCountryCode(profile.location?.country);
  const completedJobs = talent.profile?.completedJobs ?? 0;
  const fullName = profile.fullName || `${profile.firstName} ${profile.lastName}`;

  // --- NOUVEAU : États pour stocker les avis ---
  const [stats, setStats] = useState({ average: 0, count: 0, loading: true });

  // --- NOUVEAU : Récupération et calcul des notes ---
  useEffect(() => {
    let isMounted = true; // Pour éviter les erreurs si le composant est démonté

    const fetchRating = async () => {
      try {
        // On utilise l'ID du talent pour chercher ses recommandations
        const response = await apiService.recommendations.getCandidateRecommendations(talent.id);
        
        // Supposons que response.data contienne le tableau des avis
        const reviews = response.data || [];
        
        if (reviews.length > 0) {
          // Calcul de la moyenne
          const totalStars = reviews.reduce((acc, review) => acc + review.rating, 0);
          const average = totalStars / reviews.length;
          
          if (isMounted) {
            setStats({ 
              average: average, 
              count: reviews.length, 
              loading: false 
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

    if (talent.id) {
      fetchRating();
    }

    return () => { isMounted = false; };
  }, [talent.id]);

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

  return (
    <div
      onClick={onViewProfile}
      className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
    >
      {/* Bouton Options (inchangé) */}
      <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Avatar (inchangé) */}
      <img
        src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`}
        alt={fullName}
        className="w-24 h-24 rounded-full object-cover mb-2 border-4 border-white shadow-sm"
      />

      {/* Nom */}
      <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>

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

      {/* Localisation (inchangé) */}
      {profile.location?.country && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          {countryCode && (
            <img
              src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
              alt={profile.location.country}
            />
          )}
          <span>{profile.location.country}</span>
        </div>
      )}

      {/* Compétences (inchangé) */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
        <BriefcaseIcon className="w-5 h-5 text-gray-400" />
        <p className="line-clamp-1">
          {profile.skills?.slice(0, 2).join(" • ") || "Aucune compétence listée"}
        </p>
      </div>

      {/* Email (inchangé) */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
        <EnvelopeIcon className="w-5 h-5 text-gray-400" />
        <span className="text-gray-600">{talent.email}</span>
      </div>

      {/* Missions complétées (inchangé) */}
      <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
        {completedJobs} mission{completedJobs !== 1 ? "s" : ""} complétée{completedJobs !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default TalentCard;