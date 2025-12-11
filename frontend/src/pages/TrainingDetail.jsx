import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { formatPoints } from "../utils/format";
import ReviewsSection from "../components/Training/ReviewsSection";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import {
  StarIcon,
  CheckIcon,
  PlayCircleIcon,
  LockClosedIcon,
  GlobeAltIcon,
  LanguageIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  TvIcon,
  DocumentArrowDownIcon,
  TrophyIcon,
  WalletIcon,
  XMarkIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const TrainingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userHasEnrolled, setUserHasEnrolled] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // NOUVEL ÉTAT POUR LE MODAL
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Charger les données
  const fetchTraining = async () => {
    try {
      const response = await apiService.trainings.publicDetails(id); // On créera cette route publique spécifique
      if (response.success) {
        setTraining(response.training);
        setUserHasEnrolled(response.hasEnrolled);
        setUserHasReviewed(response.hasReviewed);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger la formation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
    window.scrollTo(0, 0);
  }, [id]);

  // --- 1. GESTIONNAIRE D'OUVERTURE DU MODAL ---
  const handleEnroll = () => {
    if (!user) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      return navigate("/login");
    }

    if (user.role !== "candidate") {
      return toast.error("Seuls les candidats peuvent s'inscrire.");
    }

    // Ouvre le modal de confirmation
    setIsEnrollModalOpen(true);
  };

  // --- 2. GESTIONNAIRE DE CONFIRMATION (API CALL) ---
  // Cette fonction doit être ici, accessible par le bouton "Confirmer"
  const onConfirmEnroll = async () => {
    const toastId = toast.loading("Validation de la transaction...");

    try {
      const res = await apiService.trainings.enroll(id);

      if (res.success) {
        toast.success("Inscription réussie !", { id: toastId });
        setUserHasEnrolled(true);
        setIsEnrollModalOpen(false); // Fermer le modal
        // Optionnel: Vous pourriez vouloir rafraîchir l'utilisateur pour mettre à jour son solde affiché dans le header
        // refreshUser();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur inscription", {
        id: toastId,
      });
      // On laisse le modal ouvert en cas d'erreur (ex: solde insuffisant) pour qu'il comprenne pourquoi
    }
  };

  // Helper pour l'image
  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/600x400?text=No+Preview";
    if (path.startsWith("http")) return path;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    return `${apiUrl.replace(/\/api$/, "")}${path}`;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (!training)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Formation introuvable
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      {/* --- HEADER NOIR (Hero Section) --- */}
      <div className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row gap-8 relative z-10">
          {/* Colonne Gauche (Infos) */}
          <div className="md:w-2/3 pr-0 md:pr-8">
            <div className="flex gap-2 text-sm font-semibold text-emerald-400 mb-4">
              <span>{training.category}</span>
              {/* <span>{">"}</span>
              <span>{training.subCategory || "Général"}</span> */}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {training.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              {training.subtitle ||
                "Apprenez les compétences les plus demandées avec ce cours complet."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
              {/* <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">
                Meilleure vente
              </span> */}
              <div className="flex items-center text-yellow-500 font-bold">
                <span className="mr-1">{training.averageRating || "0.0"}</span>
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(training.averageRating)
                        ? "text-yellow-500"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-300 underline cursor-pointer">
                ({training.reviews?.length || 0} avis)
              </span>
              <span className="text-white font-medium">
                {training.totalStudents} participants
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-300">
              <div className="flex items-center">
                <span className="mr-2">Créé par</span>{" "}
                <a href="#instructor" className="text-emerald-400 underline">
                  {training.trainer?.trainerProfile?.firstName}{" "}
                  {training.trainer?.trainerProfile?.lastName}
                </a>
              </div>
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-4 h-4 mr-1" /> Dernière mise
                à jour : {new Date(training.updatedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <GlobeAltIcon className="w-4 h-4 mr-1" />{" "}
                {training.language || "Français"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="container mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row gap-12 relative">
        {/* COLONNE GAUCHE (Détails) */}
        <div className="md:w-2/3">
          {/* Ce que vous apprendrez */}
          <div className="border border-gray-300 p-6 rounded-lg mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Ce que vous apprendrez
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {training.objectives?.map((obj, i) => (
                <div key={i} className="flex items-start text-sm text-gray-700">
                  <CheckIcon className="w-5 h-5 text-gray-900 mr-3 flex-shrink-0" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contenu du cours (Accordéon) */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contenu du cours
            </h2>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>
                {training.modules?.length} sections • {training.totalLessons}{" "}
                sessions • {Math.round(training.duration / 60)}h{" "}
                {training.duration % 60}m durée totale
              </span>
              <button className="font-bold text-emerald-700 hover:underline">
                Tout développer
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {training.modules?.map((module) => (
                <Disclosure key={module.id}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left focus:outline-none">
                        <div className="flex items-center font-bold text-gray-800">
                          {open ? (
                            <ChevronUpIcon className="w-4 h-4 mr-3" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 mr-3" />
                          )}
                          {module.title}
                        </div>
                        <span className="text-sm text-gray-500">
                          {module.lessons?.length} sessions
                        </span>
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-5 py-2 text-sm text-gray-500 bg-white">
                        <ul className="space-y-3 py-2">
                          {module.lessons?.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex justify-between items-center"
                            >
                              <div className="flex items-center">
                                {lesson.type === "video" ? (
                                  <PlayCircleIcon className="w-4 h-4 mr-3 text-gray-400" />
                                ) : (
                                  <DocumentArrowDownIcon className="w-4 h-4 mr-3 text-gray-400" />
                                )}
                                <span
                                  className={
                                    lesson.isFreePreview
                                      ? "text-emerald-700 underline cursor-pointer"
                                      : ""
                                  }
                                >
                                  {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                {lesson.isFreePreview && (
                                  <span className="text-emerald-700 text-xs font-bold">
                                    Aperçu
                                  </span>
                                )}
                                <span>{lesson.duration} min</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ))}
            </div>
          </div>

          {/* Pré-requis */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pré-requis
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              {training.prerequisites?.length > 0 ? (
                training.prerequisites.map((req, i) => <li key={i}>{req}</li>)
              ) : (
                <li>Aucun pré-requis spécifique.</li>
              )}
            </ul>
          </div>

          {/* Description */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Description
            </h2>
            <div className="prose max-w-none text-sm text-gray-800 whitespace-pre-line">
              {training.description}
            </div>
          </div>

          {/* Formateur */}
          <div className="mb-10" id="instructor">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Formateur</h2>
            <div className="flex items-start gap-4">
              <img
                src={getImageUrl(training.trainer?.trainerProfile?.avatar)}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                alt="Avatar"
              />
              <div>
                <h3 className="font-bold text-lg text-emerald-700 underline mb-1">
                  {training.trainer?.trainerProfile?.firstName}{" "}
                  {training.trainer?.trainerProfile?.lastName}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {training.trainer?.trainerProfile?.specialties?.join(", ")}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {training.trainer?.trainerProfile?.bio ||
                    "Pas de bio disponible."}
                </p>
              </div>
            </div>
          </div>

          {/* Avis */}
          <ReviewsSection
            trainingId={id}
            reviews={training.reviews}
            userHasEnrolled={userHasEnrolled}
            userHasReviewed={userHasReviewed}
            onReviewAdded={fetchTraining} // Rafraîchir après ajout d'avis
          />
        </div>

        {/* --- SIDEBAR STICKY (Droite) --- */}
        <div className="md:w-1/3 relative">
          <div className="sticky top-24 bg-white border border-white shadow-xl rounded-lg overflow-hidden -mt-80 z-20 hidden md:block">
            {/* Vidéo preview */}
            <div className="relative aspect-video bg-black cursor-pointer group">
              <img
                src={getImageUrl(training.thumbnail)}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition"
                alt="Cover"
              />
              {/* <div className="absolute inset-0 flex flex-col items-center justify-center">
                <PlayCircleIcon className="w-16 h-16 text-white bg-white/20 rounded-full shadow-lg backdrop-blur-sm" />
                <span className="text-white font-bold mt-4 text-lg">
                  Aperçu du cours
                </span>
              </div> */}
            </div>

            <div className="p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatPoints(training.price)}
              </div>

              {userHasEnrolled ? (
                <div className="bg-emerald-100 text-emerald-800 text-center py-3 rounded-md font-bold mb-4">
                  Vous êtes inscrit ✅
                </div>
              ) : (
                <>
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-md transition-colors mb-4 text-lg"
                  >
                    S'inscrire maintenant
                  </button>
                  <p className="text-center text-xs text-gray-500 mb-4">
                    Garantie satisfait ou remboursé de 30 jours
                  </p>
                </>
              )}

              <div className="space-y-3 text-sm text-gray-700">
                <h4 className="font-bold text-gray-900">Ce cours comprend :</h4>
                <div className="flex items-center">
                  <TvIcon className="w-4 h-4 mr-3" />{" "}
                  {Math.round(training.duration / 60)} heures de vidéo
                </div>
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="w-4 h-4 mr-3" />{" "}
                  {training.totalLessons} ressources téléchargeables
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="w-4 h-4 mr-3" /> Accès illimité
                </div>
                <div className="flex items-center">
                  <TrophyIcon className="w-4 h-4 mr-3" /> Certificat de fin de
                  formation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- VUE MOBILE : BARRE D'ACTION FIXE EN BAS --- */}
      {/* "fixed bottom-0" colle la barre en bas. "md:hidden" la cache sur les écrans larges. */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">
              {formatPoints(training.price)}
            </span>
            {/* Petit texte promo si besoin */}
            {training.discountPrice > 0 && (
              <span className="text-xs text-gray-500 line-through">
                {formatPoints(training.discountPrice)}
              </span>
            )}
          </div>

          {userHasEnrolled ? (
            <button
              className="flex-grow bg-emerald-100 text-emerald-800 font-bold py-3 px-6 rounded-lg text-sm"
              disabled
            >
              Accéder au cours
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md text-sm transition-colors"
            >
              S'inscrire maintenant
            </button>
          )}
        </div>
      </div>
      {/* --- MODAL DE CONFIRMATION D'INSCRIPTION --- */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-emerald-600" />
                Confirmer l'inscription
              </h3>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Corps du Modal */}
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600 text-center">
                Vous êtes sur le point de débloquer la formation <br />
                <span className="font-bold text-gray-900">
                  "{training.title}"
                </span>
                .
              </p>

              {/* Comparaison des Fonds */}
              <div className="space-y-3">
                {/* Solde Actuel */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                      <WalletIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      Votre solde actuel
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {user.profile?.trainingPoints || 0} points
                  </span>
                </div>

                {/* Prix Formation */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-200 text-emerald-700 rounded-full">
                      <ArrowRightIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-emerald-800">
                      Prix de la formation
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700">
                    - {formatPoints(training.price)}
                  </span>
                </div>
              </div>

              {/* Résultat Calculé */}
              <div className="border-t border-dashed border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-500">
                    Nouveau solde après achat
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      (user.profile?.trainingPoints || 0) - training.price < 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {/* Calcul simple pour l'affichage */}
                    {formatPoints(
                      (user.profile?.trainingPoints || 0) - training.price
                    )}
                  </span>
                </div>
                {(user.profile?.trainingPoints || 0) < training.price && (
                  <p className="text-xs text-red-500 mt-2 text-right font-medium">
                    Solde insuffisant. Veuillez recharger votre compte.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>

              <button
                onClick={onConfirmEnroll}
                disabled={(user.profile?.trainingPoints || 0) < training.price}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingDetail;
