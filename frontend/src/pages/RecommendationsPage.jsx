import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
// On importe ton service API configuré
import { apiService } from "../services/api";

// --- COMPOSANT : CARTE D'AVIS ---
// Ce composant affiche un seul avis. Il sera répété pour chaque avis reçu.
const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow relative">
      {/* En-tête : Nom + Date */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-gray-900 text-lg">
            {review.reviewerName || "Client"}
          </h4>
          <p className="text-sm text-gray-500 font-medium">
            {review.reviewerCompany || "Entreprise"}
          </p>
        </div>
        <span className="text-xs text-gray-400 flex items-center bg-gray-50 px-2 py-1 rounded-md">
          <CalendarDaysIcon className="w-3 h-3 mr-1" />
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Date inconnue"}
        </span>
      </div>

      {/* Étoiles */}
      <div className="flex text-yellow-400 my-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-5 h-5 ${
              star <= review.rating ? "text-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Commentaire */}
      <p className="text-gray-700 leading-relaxed mb-4 text-sm">
        {review.comment || "Aucun commentaire écrit."}
      </p>

      {/* Pied de carte : Note et Badge Mission */}
      <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
        <span className="text-gray-500 font-medium text-xs">
          Note donnée :{" "}
          <span className="text-gray-900 font-bold">{review.rating}/5</span>
        </span>

        {/* Si l'avis est lié à une mission, on l'affiche */}
        {review.jobTitle && (
          <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-xs font-bold border border-pink-100 truncate max-w-[150px]">
            {review.jobTitle}
          </span>
        )}
      </div>
    </div>
  );
};

// --- PAGE PRINCIPALE ---
const RecommendationsPage = () => {
  const { id } = useParams(); // L'ID du talent dans l'URL
  const navigate = useNavigate();

  // États pour stocker les données API
  const [talent, setTalent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Chargement des données ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer le profil public du talent
        // On utilise apiService.users.getProfile(id)
        const profileResponse = await apiService.users.getProfile(id);

        // 2. Récupérer les recommandations
        // On utilise apiService.recommendations.getCandidateRecommendations(id)
        const reviewsResponse =
          await apiService.recommendations.getCandidateRecommendations(id);

        // Mise à jour de l'état talent
        if (profileResponse.success) {
          setTalent(profileResponse.data);
        } else {
          // Fallback si la structure est différente (parfois data est direct)
          setTalent(profileResponse.data || profileResponse);
        }

        // Mise à jour de l'état reviews
        if (reviewsResponse.success && reviewsResponse.data) {
          // L'API renvoie souvent { recommendations: [...], ... } ou directement le tableau
          const recs =
            reviewsResponse.data.recommendations ||
            (Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);
          setReviews(recs);
        }
      } catch (err) {
        console.error("Erreur chargement page recommandation :", err);
        setError("Impossible de charger les informations du talent.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // --- Gestion du chargement ---
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500 animate-pulse">
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  // --- Gestion des erreurs ---
  if (error || !talent) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-2">Oups !</h2>
          <p className="text-gray-600 mb-6">
            {error || "Utilisateur introuvable."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retour en arrière
          </button>
        </div>
      </div>
    );
  }

  // Extraction propre des données pour éviter les crashs
  // L'API renvoie parfois "profile" ou "candidateProfile"
  const userProfile = talent.profile || talent.candidateProfile || {};
  const fullName =
    userProfile.fullName ||
    `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() ||
    "Utilisateur";
  
  // URL Avatar propre
  const getAvatarUrl = (path) => {
    if (!path) return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
    if (path.startsWith("http")) return path;
    const apiUrl = import.meta.env.VITE_API_URL || ""; 
    const baseUrl = apiUrl.replace(/\/api$/, "");
    return `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Bouton Retour */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)} // Retour à la page précédente
          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 hover:shadow"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Retour
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* =========================================================
            1. HEADER CENTRÉ
           ========================================================= */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center text-center mb-8 border border-gray-100 relative overflow-hidden">
          {/* Décoration d'arrière-plan (cercle flou) */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-50 z-0"></div>

          {/* Avatar avec bordure */}
          <div className="relative z-10 mt-4">
            <img
              src={getAvatarUrl(userProfile.avatar)}
              alt={fullName}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4 bg-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
              }}
            />
            {/* Indicateur de disponibilité (vert si true) */}
            {userProfile.availability === "available" && (
              <span className="absolute bottom-4 right-2 bg-green-500 w-6 h-6 border-4 border-white rounded-full" title="Disponible"></span>
            )}
          </div>

          {/* Nom & Profession */}
          <div className="z-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {fullName}
            </h1>
            <p className="text-xl text-indigo-600 font-medium mb-6">
              {userProfile.profession || "Profession non renseignée"}
            </p>
          </div>

          {/* Ligne de Contact (Centrée et en dessous) */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 border-t border-gray-100 pt-6 w-full max-w-2xl z-10">
            {/* Email */}
            {talent.email && (
              <div className="flex items-center text-gray-600 group cursor-default">
                <div className="p-2 bg-gray-50 rounded-full text-indigo-500 mr-2 border border-gray-100">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{talent.email}</span>
              </div>
            )}

            {/* Téléphone (si disponible) */}
            {userProfile.phone && (
              <div className="flex items-center text-gray-600 group cursor-default">
                <div className="p-2 bg-gray-50 rounded-full text-green-500 mr-2 border border-gray-100">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{userProfile.phone}</span>
              </div>
            )}

            {/* Localisation */}
            {userProfile.location?.country && (
              <div className="flex items-center text-gray-600 group cursor-default">
                <div className="p-2 bg-gray-50 rounded-full text-red-500 mr-2 border border-gray-100">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">
                  {userProfile.location.city
                    ? `${userProfile.location.city}, `
                    : ""}
                  {userProfile.location.country}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            2. GRILLE PRINCIPALE (2 COLONNES)
           ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- COLONNE GAUCHE : AVIS --- */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
                Avis & Recommandations
                <span className="ml-2 bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {reviews.length}
                </span>
              </h2>
            </div>

            {/* BOUCLE D'AFFICHAGE DES AVIS */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id || review._id} review={review} />
                ))}
              </div>
            ) : (
              // Message vide s'il n'y a pas d'avis
              <div className="bg-white rounded-xl p-10 text-center border border-dashed border-gray-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                  <StarIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Aucun avis pour le moment
                </h3>
                <p className="text-gray-500 text-sm">
                  Ce talent n'a pas encore reçu de recommandations.
                </p>
              </div>
            )}
          </div>

          {/* --- COLONNE DROITE : INFO RESTANTES (SIDEBAR) --- */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bloc 1: Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 border-b pb-2 text-sm uppercase tracking-wide">
                Activité
              </h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 text-sm">Missions terminées</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                  {userProfile.completedJobs || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Note moyenne</span>
                <div className="flex items-center">
                  <span className="font-bold text-gray-900 mr-1 text-lg">
                    {/* Calcul de moyenne si l'API ne la fournit pas directement */}
                    {reviews.length > 0
                      ? (
                          reviews.reduce((acc, r) => acc + Number(r.rating), 0) /
                          reviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Bloc 2: Compétences */}
            {userProfile.skills && userProfile.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center border-b pb-2 text-sm uppercase tracking-wide">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-indigo-500" />
                  Compétences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bloc 3: Bio */}
            {userProfile.bio && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 border-b pb-2 text-sm uppercase tracking-wide">
                  À propos
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {userProfile.bio}
                </p>
              </div>
            )}

            {/* Bloc 4: Badge Vérifié */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
               {/* Cercle déco */}
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
               
              <div className="flex items-center mb-3 relative z-10">
                <CheckBadgeIcon className="w-8 h-8 text-yellow-300 mr-3" />
                <h3 className="font-bold text-lg">Profil Vérifié</h3>
              </div>
              <p className="text-indigo-100 text-xs leading-relaxed relative z-10">
                L'identité de ce talent a été confirmée par notre équipe de modération.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;