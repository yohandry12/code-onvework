import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Link et useNavigate
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
// import FreelancerProfileModal from "../components/UI/FreelancerProfileModal"; // SUPPRIMÉ
import TestimonialsSection from "../pages/TestimonialsSection";
import homeIllustration from "../assets/images/home.jpg";
import { Flame, Star, Sparkles } from "lucide-react";

// --- Carte de catégorie ---
const CategoryCard = ({ name, icon, onClick }) => (
  <button
    onClick={onClick}
    className="group text-center p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200 hover:bg-amber-50 transition-all duration-300 w-full"
  >
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-xl text-3xl">
      {icon}
    </div>
    <p className="font-semibold text-gray-800">{name}</p>
  </button>
);

// --- Carte d’offre ---
const JobCard = ({ job }) => {
  const isCompleted = job.status === "filled";
  const isRepublished = !!job.clonedFromId;
  const isFrozen = job.isFrozen;
  const isInProgress = job.status === "in_progress";
  const isFeatured = job.featured;
  const isUrgent = job.isUrgent;

  // Calcul du style dynamique
  let containerStyle =
    "bg-white/80 backdrop-blur-md border border-gray-200 hover:border-blue-500 hover:shadow-md"; // Base pour la Home

  if (isCompleted || isFrozen) {
    containerStyle = "bg-gray-50/80 border-gray-200 opacity-80";
  } else if (isUrgent) {
    containerStyle =
      "bg-red-50/60 border-red-200 hover:border-red-400 hover:shadow-red-100 hover:shadow-md";
  } else if (isFeatured) {
    containerStyle =
      "bg-amber-50/60 border-amber-200 hover:border-amber-400 hover:shadow-amber-100 hover:shadow-md";
  }

  return (
    <article
      className={`rounded-2xl p-6 shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden ${containerStyle}`}
    >
      {/* Effet décoratif pour Vedette */}
      {isFeatured && !isCompleted && !isFrozen && (
        <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none rotate-12">
          <Sparkles className="w-32 h-32 text-amber-500" />
        </div>
      )}

      <div className="flex-1 z-10">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* BADGE URGENT */}
          {isUrgent && !isCompleted && !isFrozen && (
            <span className="flex items-center bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 animate-pulse">
              <Flame className="w-3 h-3 mr-1 fill-red-500" /> URGENT
            </span>
          )}

          {/* BADGE PREMIUM */}
          {isFeatured && !isCompleted && !isFrozen && (
            <span className="flex items-center bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
              <Star className="w-3 h-3 mr-1 fill-amber-500" /> PREMIUM
            </span>
          )}

          {isRepublished && (
            <span className="flex items-center bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
              <ArrowPathIcon className="w-3 h-3 mr-1" /> Republiée
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <h3
            className={`text-lg font-bold line-clamp-2 ${
              isCompleted ? "text-gray-400" : "text-gray-900"
            }`}
          >
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>
          {isCompleted && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
              Terminée
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills?.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-200/60 pt-4 z-10">
        <span className="text-sm text-gray-500 font-medium truncate max-w-[150px]">
          {job.client?.company ||
            (job.client?.firstName &&
              `${job.client.firstName} ${job.client.lastName}`) ||
            "Client"}
        </span>
        <Link
          to={`/jobs/${job.id}`}
          className={`text-sm px-5 py-2 rounded-lg font-semibold transition-colors shadow-sm
            ${
              isUrgent && !isCompleted
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }
          `}
        >
          Voir
        </Link>
      </div>
    </article>
  );
};

// --- FONCTION UTILITAIRE POUR L'AVATAR ---
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const apiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = apiUrl.replace(/\/api$/, "");
  const cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;

  return `${baseUrl}${cleanPath}`;
};

// --- CARTE FREELANCER MODIFIÉE (Avec Navigation) ---
const FreelancerCard = ({ user }) => {
  const navigate = useNavigate(); // Hook de navigation

  const profile = user.profile || {};
  const title =
    profile.profession ||
    (profile.skills && profile.skills[0]) ||
    "Talent Freelance";
  const fullName =
    profile.fullName ||
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  const [stats, setStats] = useState({ average: 0, count: 0, loading: true });

  useEffect(() => {
    let isMounted = true;
    const fetchRating = async () => {
      try {
        const candidateId = user.id || user.userId;
        if (!candidateId) return;

        const response =
          await apiService.recommendations.getCandidateRecommendations(
            candidateId
          );

        if (response.success && response.data) {
          const { averageRating, totalRecommendations } = response.data;
          if (isMounted) {
            setStats({
              average: Number(averageRating) || 0,
              count: Number(totalRecommendations) || 0,
              loading: false,
            });
          }
        } else {
          if (isMounted) setStats({ average: 0, count: 0, loading: false });
        }
      } catch (error) {
        if (isMounted) setStats({ average: 0, count: 0, loading: false });
      }
    };

    fetchRating();
    return () => {
      isMounted = false;
    };
  }, [user]);

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

  const avatarSrc = profile.avatar
    ? getAvatarUrl(profile.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  // ID du talent pour la navigation
  const talentId = user.id || user.userId;

  return (
    <div
      onClick={() => navigate(`/talents/${talentId}`)} // <-- NAVIGATION ICI
      className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm hover:shadow-md 
                 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center gap-4 p-6"
    >
      {/* Avatar */}
      <div className="relative">
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
      </div>

      {/* Etoiles */}
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

      {/* Infos */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800">{fullName}</h3>
        <p className="text-sm text-gray-500 italic">{title}</p>
      </div>

      {/* Compétences */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {profile.skills?.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1 text-xs bg-amber-50 text-amber-700 font-medium rounded-full border border-amber-100"
          >
            {skill}
          </span>
        ))}
      </div>

      <div
        className="mt-4 w-full px-4 py-2.5 text-center rounded-lg border border-amber-500 text-amber-700 
                      font-semibold bg-amber-100/60 hover:bg-amber-200 transition"
      >
        Voir le profil
      </div>
    </div>
  );
};

const CardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-2xl border border-white/10 p-6 animate-pulse h-64">
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-5/6"></div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [categories] = useState([
    { name: "Marketing", icon: "📣", key: "marketing" },
    { name: "Développement", icon: "💻", key: "development" },
    { name: "Design", icon: "🎨", key: "design" },
    { name: "Rédaction", icon: "✍️", key: "writing" },
    { name: "Consulting", icon: "📊", key: "consulting" },
    { name: "Données", icon: "📈", key: "data" },
  ]);
  const [topFreelancers, setTopFreelancers] = useState([]);
  const [query, setQuery] = useState("");
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  // use state pour l'authentification
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    let mounted = true;
    setLoadingFreelancers(true);

    Promise.allSettled([
      apiService.jobs.getAll({ limit: 6 }),
      apiService.users.search("", "candidate", 1, 6),
    ]).then(([jobsRes, usersRes]) => {
      if (!mounted) return;

      if (jobsRes.status === "fulfilled") {
        setFeaturedJobs(jobsRes.value.jobs || []);
      }

      if (usersRes.status === "fulfilled") {
        setTopFreelancers(usersRes.value.users || []);
      }
      setLoadingFreelancers(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // SUPPRESSION DE LA MODALE ET DES HANDLERS ASSOCIÉS

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/jobs?search=${encodeURIComponent(query)}`);
  };

  const handleCategoryClick = (categoryKey) => {
    navigate(`/jobs?category=${categoryKey}`);
  };

  return (
    <div
      className="min-h-screen text-gray-800 font-sans relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #faf6f0 0%, #f4efe8 40%, #e6e1db 100%)",
      }}
    >
      {/* HERO */}
      <section
        className="relative flex flex-col items-center justify-center text-center bg-cover bg-center bg-no-repeat bg-fixed min-h-[85vh] px-6 py-24"
        style={{
          backgroundImage: `linear-gradient(rgb(15 15 15 / 50%), rgb(0 0 0 / 50%)), url(${homeIllustration})`,
        }}
      >
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-gray-200">
            Suivez vos <br className="sm:hidden" />{" "}
            <span className="text-amber-600">rêves professionnels</span>
          </h1>

          <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto mb-8">
            Trouvez la mission idéale dans un cadre de confiance et de
            bienveillance.
          </p>

          {/* Boutons pour la creation des differents comptes a savoir : Candidat et Client */}


              {isAuthenticated && user ? (
                <form
                  onSubmit={onSearch}
                  className="flex flex-col sm:flex-row w-full max-w-md sm:max-w-xl mx-auto bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md"
                >
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ex : Comptabilité, Design, React..."
                        className="flex-1 px-4 py-3 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-center sm:text-left"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                      >
                        Rechercher
                      </button>
                </form>
              ) : (
              <div className="max-w-xl mx-auto flex items-center justify-around my-4">
                  <Link to="/register" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg border-4 border-white">
                    Je suis candidat
                  </Link>
                  <Link to="/register" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg border-4 border-white">
                    Je suis client
                  </Link>
              </div>
              )}
        </div>
      </section>

      {/* CORPS PRINCIPAL */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-20 space-y-20">
        {/* Catégories */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Explorez les catégories
            </h2>
            <Link
              to="/jobs"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Voir toutes
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {categories.map((c) => (
              <CategoryCard
                key={c.key}
                name={c.name}
                icon={c.icon}
                onClick={() => handleCategoryClick(c.key)}
              />
            ))}
          </div>
        </section>

        {/* Offres en vedette */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Offres en vedette
            </h2>
            <Link
              to="/jobs"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Voir plus
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-12">
                Aucune offre en vedette pour l'instant.
              </p>
            ) : (
              featuredJobs.map((j) => <JobCard key={j.id} job={j} />)
            )}
          </div>
        </section>

        {/* Talents */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Talents recommandés
            </h2>
            <Link
              to="/talents"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingFreelancers
              ? [1, 2, 3].map((n) => <CardSkeleton key={n} />)
              : topFreelancers.map((freelancer) => (
                  <FreelancerCard
                    key={freelancer.id}
                    user={freelancer}
                    // Pas besoin de passer de fonction, la carte gère la navigation
                  />
                ))}
          </div>
        </section>

        <TestimonialsSection />
      </main>

      {/* PLUS DE MODALE ICI */}
    </div>
  );
};

export default Home;
