import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext"; // Import Auth
import { formatPoints } from "../utils/format";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import StarRating from "../components/UI/StarRating"; // Votre composant étoile
import toast from "react-hot-toast"; // Pour les notifications
import {
  UserCircleIcon,
  StarIcon,
  UsersIcon,
  PlayCircleIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { MapPinIcon } from "@heroicons/react/24/outline";
import TrainerReviews from "../components/Training/TrainerReviews";

const TrainerPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Récupérer l'utilisateur connecté

  const [trainer, setTrainer] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour la modale de notation
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Stats calculées
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageRating: 0,
    totalReviews: 0,
    courseCount: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await apiService.users.getProfile(id);
      const coursesRes = await apiService.trainings.publicTrainings({
        trainerId: id,
        limit: 100,
      });

      // 1. On prépare les données du profil
      let profileData = {};
      if (userRes.success) {
        setTrainer(userRes.user);
        // On récupère le profil correctement
        profileData = userRes.user.profile || userRes.user.trainerProfile || {};
      }

      if (coursesRes.success) {
        setCourses(coursesRes.trainings);

        const totalStudents = coursesRes.trainings.reduce(
          (acc, c) => acc + (c.totalStudents || 0),
          0
        );

        // --- CORRECTION ICI ---
        // On utilise la note qui vient de la BDD (TrainerProfile)
        // et non pas un recalcul basé sur les cours.
        const averageRating = profileData.averageRating
          ? parseFloat(profileData.averageRating).toFixed(1)
          : "0.0";

        setStats({
          totalStudents,
          averageRating, // On utilise la vraie note
          totalReviews: 0,
          courseCount: coursesRes.trainings.length,
        });
      }
    } catch (error) {
      console.error("Erreur chargement profil", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  // --- GESTION DE LA NOTATION ---
  const handleOpenReview = () => {
    if (!user) {
      // Redirection login si non connecté
      return navigate("/login");
    }
    setIsReviewModalOpen(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (userRating === 0) return toast.error("Veuillez choisir une note.");

    setSubmittingReview(true);
    try {
      await apiService.users.rateTrainer(id, {
        rating: userRating,
        comment: userComment,
      });
      toast.success("Votre avis a été publié !");
      setIsReviewModalOpen(false);
      setUserComment("");
      setUserRating(0);
      // Optionnel : Recharger les données pour mettre à jour la moyenne
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper Image
  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/150x150?text=Avatar";
    if (path.startsWith("http")) return path;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    return `${apiUrl.replace(/\/api$/, "")}${path}`;
  };

  const getCourseImage = (path) => {
    if (!path) return "https://placehold.co/300x170?text=Cours";
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
  if (!trainer)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Formateur introuvable
      </div>
    );

  const profile = trainer.profile || {};

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col-reverse md:flex-row gap-12">
          {/* COLONNE GAUCHE : CONTENU */}
          <div className="md:w-2/3">
            <div className="mb-2 uppercase text-xs font-bold text-gray-500 tracking-wider">
              Formateur
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {profile.firstName} {profile.lastName}
            </h1>
            <h2 className="text-lg font-medium text-gray-600 mb-6">
              {profile.specialties
                ? profile.specialties.join(" • ")
                : "Formateur sur Onvework"}
            </h2>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-8 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">
                  Total Étudiants
                </div>
                <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-gray-400" />{" "}
                  {stats.totalStudents}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">
                  Formations
                </div>
                <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PlayCircleIcon className="w-5 h-5 text-gray-400" />{" "}
                  {stats.courseCount}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">
                  Note Moyenne
                </div>
                <div className="text-xl font-bold text-gray-900 flex items-center">
                  {stats.averageRating}{" "}
                  <StarIcon className="w-5 h-5 text-yellow-500 ml-1" />
                </div>
              </div>
            </div>

            {/* Biographie */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                À propos de moi
              </h3>
              <div className="prose text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {profile.bio ||
                  "Aucune biographie disponible pour ce formateur."}
              </div>
            </div>

            {/* Liste des cours */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Mes formations ({stats.courseCount})
              </h3>
              <div className="space-y-4">
                {courses.map((course) => (
                  <Link
                    to={`/trainings/${course.id}`}
                    key={course.id}
                    className="flex flex-col sm:flex-row gap-4 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white group"
                  >
                    <div className="sm:w-60 h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
                      <img
                        src={getCourseImage(course.thumbnail)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        alt={course.title}
                      />
                    </div>
                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-emerald-700">
                          {course.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center text-xs font-medium text-gray-500 gap-4">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {course.level}
                          </span>
                          <span className="flex items-center">
                            <PlayCircleIcon className="w-3 h-3 mr-1" />{" "}
                            {course.totalLessons || 0} leçons
                          </span>
                          <span className="flex items-center">
                            <StarIcon className="w-3 h-3 text-yellow-500 mr-1" />{" "}
                            {course.averageRating || "0.0"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right mt-2 sm:mt-0 font-bold text-emerald-600">
                        {formatPoints(course.price)}
                      </div>
                    </div>
                  </Link>
                ))}
                {courses.length === 0 && (
                  <p className="text-gray-500 italic">
                    Aucune formation publiée pour le moment.
                  </p>
                )}
              </div>
            </div>
            {/* AVIS DU FORMATEUR (NOUVEAU) */}
            <TrainerReviews trainerId={id} />
          </div>

          {/* COLONNE DROITE : PROFIL STICKY */}
          <div className="md:w-1/3">
            <div className="sticky top-24">
              <div className="flex flex-col items-center text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 ring-2 ring-gray-100">
                  <img
                    src={getImageUrl(profile.avatar)}
                    alt={profile.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* BOUTON DE NOTATION */}
                {user?.role === "candidate" && (
                  <button
                    onClick={handleOpenReview}
                    className="mb-6 w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-900 text-gray-900 font-bold py-2 px-4 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    Laisser un avis
                  </button>
                )}

                <div className="w-full space-y-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-full py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:text-emerald-600 hover:border-emerald-600 transition"
                    >
                      <GlobeAltIcon className="w-5 h-5 mr-2" /> Site Web
                    </a>
                  )}
                  {profile.linkedinProfile && (
                    <a
                      href={profile.linkedinProfile}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-full py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:text-blue-700 hover:border-blue-700 transition"
                    >
                      <BriefcaseIcon className="w-5 h-5 mr-2" /> LinkedIn
                    </a>
                  )}
                </div>

                <div className="text-left w-full space-y-4 mt-6 pt-6 border-t border-gray-100">
                  {profile.location && (
                    <div className="flex items-start text-gray-600 text-sm">
                      <MapPinIcon className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400" />
                      <span>
                        {profile.location.city}, {profile.location.country}
                      </span>
                    </div>
                  )}
                  {profile.yearsExperience && (
                    <div className="flex items-start text-gray-600 text-sm">
                      <CheckBadgeIcon className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-600" />
                      <span>{profile.yearsExperience} ans d'expérience</span>
                    </div>
                  )}
                  <div className="flex items-start text-gray-600 text-sm">
                    <UserCircleIcon className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400" />
                    <span>
                      Membre depuis {new Date(trainer.createdAt).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALE DE NOTATION --- */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Noter {profile.firstName}
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitReview} className="p-6">
              <div className="flex flex-col items-center mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  Quelle note donnez-vous à ce formateur ?
                </p>
                <StarRating
                  rating={userRating}
                  onRatingChange={setUserRating}
                  size={8}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Votre commentaire
                </label>
                <textarea
                  rows="4"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  placeholder="Partagez votre expérience avec ce formateur..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {submittingReview ? "Envoi..." : "Publier mon avis"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerPublicProfile;
