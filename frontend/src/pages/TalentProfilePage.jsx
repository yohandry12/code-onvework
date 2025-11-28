import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import TalentReviews from "../components/UI/TalentReviews";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

const TalentProfilePage = () => {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const navigate = useNavigate();
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (dataFetchedRef.current === id) return;

    const fetchTalent = async () => {
      try {
        setLoading(true);
        // On utilise getProfile comme avant
        const response = await apiService.users.getProfile(id);
        if (response.success) {
          setTalent(response.user);
        } else {
          setError("Impossible de charger le profil.");
        }
      } catch (err) {
        setError("Erreur serveur.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
    dataFetchedRef.current = id;
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );

  if (error || !talent)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 text-lg mb-4">
          {error || "Talent introuvable"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          Retour
        </button>
      </div>
    );

  const { profile } = talent;
  const fullName =
    profile.fullName || `${profile.firstName} ${profile.lastName}`;
  const avatarSrc = profile.avatar
    ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, "")}/${
        profile.avatar.startsWith("/")
          ? profile.avatar.substring(1)
          : profile.avatar
      }`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* --- HEADER (Bandeau de couverture fictif ou couleur) --- */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 w-full relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative">
        {/* --- CARTE PRINCIPALE --- */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 mb-8 flex flex-col md:flex-row items-start gap-8">
          {/* Avatar & Badges */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative">
              <img
                src={avatarSrc}
                alt={fullName}
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
              />
              {profile.recommendationBadge &&
                profile.recommendationBadge !== "Aucun" && (
                  <span className="absolute bottom-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                    {profile.recommendationBadge}
                  </span>
                )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-1.5 rounded-full text-sm font-medium">
              <BriefcaseIcon className="w-4 h-4" />
              <span>{profile.completedJobs || 0} missions</span>
            </div>
          </div>

          {/* Infos Principales */}
          <div className="flex-1 w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {fullName}
            </h1>
            <p className="text-xl text-blue-600 font-medium mb-4">
              {profile.profession || "Talent Freelance"}
            </p>

            <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-6">
              {profile.location?.city && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {profile.location.city}, {profile.location.country}
                </div>
              )}
              <div className="flex items-center gap-1">
                <EnvelopeIcon className="w-4 h-4" />
                {talent.email}
              </div>
              {profile.phone && (
                <div className="flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" />
                  {profile.phone}
                </div>
              )}
            </div>

            {/* Compétences (Tags) */}
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bouton Action (Optionnel) */}
          {/* <div className="flex-shrink-0">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                    Contacter
                </button>
            </div> */}
        </div>

        {/* --- GRILLE CONTENU --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNE GAUCHE : Bio & Diplômes */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">À propos</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {profile.bio ||
                  "Ce talent n'a pas encore ajouté de biographie."}
              </p>
            </div>

            {/* Avis & Recommandations (Nouveau Composant) */}
            <TalentReviews candidateId={id} />
          </div>

          {/* COLONNE DROITE : Infos sup (Diplômes, etc.) */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-blue-500" />
                Diplômes
              </h3>
              {profile.diplomas?.length > 0 ? (
                <ul className="space-y-4">
                  {profile.diplomas.map((dip, i) => (
                    <li
                      key={i}
                      className="pb-4 border-b last:border-0 border-gray-50 last:pb-0"
                    >
                      <p className="font-semibold text-gray-800">{dip.type}</p>
                      {/* <p className="text-sm text-gray-500">Année...</p> */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic text-sm">Non renseigné</p>
              )}
            </div>

            {/* Autres widgets possibles ici */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentProfilePage;
