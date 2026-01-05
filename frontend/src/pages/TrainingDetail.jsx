import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { formatPoints } from "../utils/format";
import ReviewsSection from "../components/Training/ReviewsSection";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import {
  StarIcon,
  CheckIcon,
  PlayCircleIcon,
  GlobeAltIcon,
  DocumentArrowDownIcon,
  TrophyIcon,
  WalletIcon,
  XMarkIcon,
  CreditCardIcon,
  ArrowRightIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ComputerDesktopIcon,
  UsersIcon,
  AcademicCapIcon,
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
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Charger les données
  const fetchTraining = async () => {
    try {
      const response = await apiService.trainings.publicDetails(id);
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

  // --- LOGIQUE INSCRIPTION ---
  const handleEnroll = () => {
    if (!user) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      return navigate("/login");
    }
    if (user.role !== "candidate") {
      return toast.error("Seuls les candidats peuvent s'inscrire.");
    }
    setIsEnrollModalOpen(true);
  };

  const onConfirmEnroll = async () => {
    const toastId = toast.loading("Validation de la transaction...");
    try {
      const res = await apiService.trainings.enroll(id);
      if (res.success) {
        toast.success("Inscription réussie !", { id: toastId });
        setUserHasEnrolled(true);
        setIsEnrollModalOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur inscription", {
        id: toastId,
      });
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/600x400?text=Formation";
    if (path.startsWith("http")) return path;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    return `${apiUrl.replace(/\/api$/, "")}${path}`;
  };

  // Helper pour afficher le mode de formation (si ces champs existent dans la réponse API)
  // Note: Si votre backend ne renvoie pas encore trainingType séparément, cela ne s'affichera pas,
  // mais le design est prêt pour quand vous mettrez à jour le modèle Backend.
  const getTrainingModeIcon = () => {
    switch (training.trainingType) {
      case "online":
        return <ComputerDesktopIcon className="w-5 h-5 mr-2" />;
      case "onsite":
        return <UsersIcon className="w-5 h-5 mr-2" />;
      case "hybrid":
        return <GlobeAltIcon className="w-5 h-5 mr-2" />;
      default:
        return <AcademicCapIcon className="w-5 h-5 mr-2" />;
    }
  };

  const getTrainingModeLabel = () => {
    switch (training.trainingType) {
      case "online":
        return "En ligne (Live/Zoom)";
      case "onsite":
        return "En présentiel";
      case "hybrid":
        return "Hybride (Mixte)";
      default:
        return "Format standard";
    }
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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* --- HERO SECTION --- */}
      <div className="bg-gray-900 text-white py-12 lg:py-16 relative">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row gap-8 relative z-10">
          <div className="md:w-2/3 pr-0 md:pr-8">
            {/* Fil d'ariane */}
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-4 uppercase tracking-wider">
              <span>{training.category}</span>
              <span className="text-gray-600">/</span>
              <span>{training.subCategory || "Formation"}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              {training.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              {training.subtitle ||
                "Maîtrisez de nouvelles compétences avec cette formation complète."}
            </p>

            {/* Badges de stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-8">
              {training.averageRating > 0 && (
                <div className="flex items-center bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  <span className="font-bold text-yellow-500 mr-1">
                    {training.averageRating}
                  </span>
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(training.averageRating)
                            ? "text-yellow-500"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">
                    ({training.reviews?.length || 0} avis)
                  </span>
                </div>
              )}
              <div className="flex items-center text-gray-300">
                <UsersIcon className="w-4 h-4 mr-1.5" />
                {training.totalStudents} apprenants
              </div>
              <div className="flex items-center text-gray-300">
                <GlobeAltIcon className="w-4 h-4 mr-1.5" />
                {training.language || "Français"}
              </div>
            </div>

            {/* --- BLOC LOGISTIQUE (Clé pour les centres) --- */}
            {/* On affiche ce bloc si au moins une info logistique est présente */}
            {(training.trainingType ||
              training.startDate ||
              training.location ||
              training.schedule) && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {training.trainingType && (
                  <div className="flex items-center text-emerald-300 font-medium">
                    {getTrainingModeIcon()}
                    {getTrainingModeLabel()}
                  </div>
                )}
                {training.startDate && (
                  <div className="flex items-center text-gray-200">
                    <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                    Début : {new Date(training.startDate).toLocaleDateString()}
                  </div>
                )}
                {training.schedule && (
                  <div className="flex items-center text-gray-200">
                    <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                    {training.schedule}
                  </div>
                )}
                {training.location && training.trainingType !== "online" && (
                  <div className="flex items-center text-gray-200 sm:col-span-2">
                    <MapPinIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                    {training.location}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
              <img
                src={getImageUrl(training.trainer?.trainerProfile?.avatar)}
                className="w-10 h-10 rounded-full object-cover border border-gray-600"
                alt="Formateur"
              />
              <div className="text-sm">
                <span className="text-gray-400">Proposé par</span>
                <p className="font-bold text-white">
                  {training.trainer?.trainerProfile?.organizationName ||
                    `${training.trainer?.trainerProfile?.firstName} ${training.trainer?.trainerProfile?.lastName}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENU --- */}
      <div className="container mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row gap-12 relative">
        {/* GAUCHE */}
        <div className="md:w-2/3 space-y-12">
          {/* Objectifs */}
          <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ce que vous allez apprendre
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {training.objectives?.map((obj, i) => (
                <div key={i} className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm leading-relaxed">
                    {obj}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Programme (Syllabus) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Programme de la formation
            </h2>
            <div className="flex items-center text-sm text-gray-500 mb-4 gap-4">
              <span className="flex items-center">
                <AcademicCapIcon className="w-4 h-4 mr-1" />{" "}
                {training.modules?.length} parties
              </span>
              <span className="flex items-center">
                <DocumentArrowDownIcon className="w-4 h-4 mr-1" />{" "}
                {training.totalLessons} sujets
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {training.modules?.map((module, index) => (
                <Disclosure key={module.id} defaultOpen={index === 0}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 border-b border-gray-100 text-left transition-colors">
                        <div className="flex items-center font-bold text-gray-800">
                          {open ? (
                            <ChevronUpIcon className="w-5 h-5 mr-3 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 mr-3 text-gray-400" />
                          )}
                          {module.title}
                        </div>
                        <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {module.lessons?.length} sujets
                        </span>
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-6 py-4 bg-white text-sm text-gray-600 border-b border-gray-100 last:border-0">
                        <ul className="space-y-4">
                          {module.lessons?.map((lesson) => (
                            <li key={lesson.id} className="flex gap-4">
                              <div className="mt-1">
                                <DocumentArrowDownIcon className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 mb-1">
                                  {lesson.title}
                                </h4>
                                {/* Ici on affiche le contenu/description car ce n'est plus une vidéo cachée */}
                                {lesson.content && (
                                  <p className="text-gray-500 text-xs leading-relaxed">
                                    {lesson.content}
                                  </p>
                                )}
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

          {/* Description Complète (avec Markdown basique) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Description détaillée
            </h2>
            <div className="prose prose-emerald max-w-none text-gray-700 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm whitespace-pre-wrap">
              {training.description}
            </div>
          </div>

          {/* Formateur */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              À propos du formateur
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-6">
              <img
                src={getImageUrl(training.trainer?.trainerProfile?.avatar)}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                alt="Avatar"
              />
              <div>
                <Link to={`/trainers/${training.trainer.id}`} className="group">
                  <h3 className="font-bold text-xl text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
                    {training.trainer?.trainerProfile?.organizationName ||
                      `${training.trainer?.trainerProfile?.firstName} ${training.trainer?.trainerProfile?.lastName}`}
                  </h3>
                </Link>
                <p className="text-emerald-600 font-medium text-sm mb-3">
                  {training.trainer?.trainerProfile?.specialties?.join(" • ")}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {training.trainer?.trainerProfile?.bio ||
                    "Le formateur n'a pas ajouté de biographie."}
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
            onReviewAdded={fetchTraining}
          />
        </div>

        {/* DROITE (Sticky Sidebar) */}
        <div className="md:w-1/3 relative">
          <div className="sticky top-24 z-20">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Image Preview */}
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={getImageUrl(training.thumbnail)}
                  className="w-full h-full object-cover"
                  alt="Cover"
                />
              </div>

              <div className="p-6">
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {formatPoints(training.price)}
                  </span>
                  {training.discountPrice > 0 && (
                    <span className="text-lg text-gray-400 line-through mb-1">
                      {formatPoints(training.discountPrice)}
                    </span>
                  )}
                </div>

                {userHasEnrolled ? (
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 rounded-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                    <CheckIcon className="w-5 h-5" /> Inscrit
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 mb-4"
                  >
                    S'inscrire maintenant
                  </button>
                )}

                <div className="space-y-4 text-sm text-gray-600 border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-gray-900 mb-2">
                    Cette formation inclut :
                  </h4>

                  {/* Durée */}
                  {training.duration > 0 && (
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span>
                        {Math.floor(training.duration / 60) > 0
                          ? `${Math.floor(training.duration / 60)}h `
                          : ""}{" "}
                        {training.duration % 60}min de formation
                      </span>
                    </div>
                  )}

                  {/* Ressources */}
                  <div className="flex items-center gap-3">
                    <DocumentArrowDownIcon className="w-5 h-5 text-gray-400" />
                    <span>{training.totalLessons} supports de cours</span>
                  </div>

                  {/* Accès
                  <div className="flex items-center gap-3">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                    <span>Accès sur mobile et PC</span>
                  </div> */}

                  {/* Certification */}
                  {training.certificateEnabled && (
                    <div className="flex items-center gap-3 text-emerald-700 font-medium">
                      <TrophyIcon className="w-5 h-5" />
                      <span>Certificat de fin de formation</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BARRE MOBILE (Sticky Bottom) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-gray-900">
              {formatPoints(training.price)}
            </span>
            {training.discountPrice > 0 && (
              <span className="text-xs text-gray-500 line-through">
                {formatPoints(training.discountPrice)}
              </span>
            )}
          </div>
          {userHasEnrolled ? (
            <button
              className="flex-grow bg-emerald-100 text-emerald-700 font-bold py-3 px-6 rounded-xl text-sm"
              disabled
            >
              Déjà inscrit
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              className="flex-grow bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-md text-sm"
            >
              S'inscrire
            </button>
          )}
        </div>
      </div>

      {/* --- MODAL CONFIRMATION --- */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
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

            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600 text-center">
                Vous êtes sur le point de vous inscrire à : <br />
                <span className="font-bold text-gray-900 text-base">
                  "{training.title}"
                </span>
              </p>

              <div className="space-y-3">
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
                    {(user.profile?.trainingPoints || 0).toLocaleString(
                      "fr-FR"
                    )}{" "}
                    Pts
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-200 text-emerald-700 rounded-full">
                      <ArrowRightIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-emerald-800">
                      Coût formation
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700">
                    - {formatPoints(training.price)}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-500">
                    Nouveau solde
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      (user.profile?.trainingPoints || 0) - training.price < 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatPoints(
                      (user.profile?.trainingPoints || 0) - training.price
                    )}
                  </span>
                </div>
                {(user.profile?.trainingPoints || 0) < training.price && (
                  <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium text-center border border-red-100">
                    Solde insuffisant. Veuillez recharger votre compte pour
                    continuer.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onConfirmEnroll}
                disabled={(user.profile?.trainingPoints || 0) < training.price}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
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
