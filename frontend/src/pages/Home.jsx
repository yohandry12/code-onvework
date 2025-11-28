import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import TestimonialsSection from "../pages/TestimonialsSection";
import homeIllustration from "../assets/images/home.jpg";

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

  return (
    <article className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <h3
            className={`text-lg font-bold line-clamp-2 ${
              isCompleted ? "text-gray-400" : "text-gray-900"
            }`}
          >
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>

          {isRepublished && (
            <span className="flex items-center bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Republiée
            </span>
          )}

          {isCompleted && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              Terminée
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {job.requirements?.skills?.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          {job.client?.company ||
            (job.client?.firstName &&
              `${job.client.firstName} ${job.client.lastName}`) ||
            "Entreprise inconnue"}
        </span>
        <Link
          to={`/jobs/${job.id}`}
          className="text-sm px-4 py-2 rounded-lg bg-amber-400 text-white font-semibold hover:bg-amber-500 transition"
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

const FreelancerCard = ({ user }) => {
  const profile = user.profile || {};
  const title =
    profile.profession ||
    (profile.skills && profile.skills[0]) ||
    "Talent Freelance";
  const fullName =
    profile.fullName ||
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  const [stats, setStats] = useState({ average: 0, count: 0, loading: true });

  // --- NOUVEAU : Récupération et calcul des notes ---
  useEffect(() => {
    let isMounted = true;

    const fetchRating = async () => {
      try {
        // L'ID du talent correspond à son userId
        const candidateId = user.id || user.userId;

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
  }, [user]);

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

  return (
    <div
      onClick={onViewProfile}
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

      {/* Nom + métier */}
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

      {/* Bouton Voir Profil */}
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
  const { isAuthenticated, user } = useAuth();
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
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingJobs(true);
    setLoadingFreelancers(true);

    Promise.allSettled([
      apiService.jobs.getAll({ limit: 6 }),
      // On appelle la recherche paginée, en demandant la page 1 avec une limite de 6
      apiService.users.search("", "candidate", 1, 6),
    ]).then(([jobsRes, usersRes]) => {
      if (!mounted) return;

      // Traitement des offres (inchangé)
      if (jobsRes.status === "fulfilled") {
        setFeaturedJobs(jobsRes.value.jobs || []);
      }
      setLoadingJobs(false);

      // --- CORRECTION CRUCIALE ICI ---
      // On traite la nouvelle structure de réponse paginée de l'API
      if (usersRes.status === "fulfilled") {
        // La liste des talents se trouve maintenant dans la clé "users" de la réponse
        setTopFreelancers(usersRes.value.users || []);
      }
      setLoadingFreelancers(false);
    });

    // Nettoyage au démontage du composant
    return () => {
      mounted = false;
    };
  }, []);

  const handleViewProfile = async (freelancerPreview) => {
    setIsModalLoading(true);
    // setSelectedFreelancer(freelancerPreview); // Affiche la modale avec les données de base

    try {
      // APPEL API qui déclenche l'incrémentation du compteur !
      const response = await apiService.users.getProfile(freelancerPreview.id);

      if (response.success) {
        // Met à jour la modale avec les données complètes et fraîches
        setSelectedFreelancer(response.user);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du profil détaillé:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  // const handleCloseModal = () => {
  //   setSelectedFreelancer(null);
  // };

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
      {/* HERO avec fond image et overlay beige apaisant */}
      <section
        className="relative flex flex-col items-center justify-center text-center bg-cover bg-center bg-no-repeat bg-fixed min-h-[85vh] px-6 py-24"
        style={{
          backgroundImage: `linear-gradient(rgb(15 15 15 / 50%), rgb(0 0 0 / 50%)), url(${homeIllustration})`,
        }}
      >
        {/* Overlay doux */}
        {/* <div className="absolute inset-0 bg-white/70"></div> */}

        {/* Contenu */}
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-gray-200">
            Suivez vos <br className="sm:hidden" />{" "}
            <span className="text-amber-600">rêves professionnels</span>
          </h1>

          <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto mb-8">
            Trouvez la mission idéale dans un cadre de confiance et de
            bienveillance.
          </p>

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
        </div>
      </section>

      {/* Corps principal */}
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
        {/* Talents */}{" "}
        <section>
          {" "}
          <div className="flex items-center justify-between mb-8">
            {" "}
            <h2 className="text-2xl font-bold text-gray-800">
              Talents recommandés
            </h2>{" "}
            <Link
              to="/talents"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              {" "}
              Voir tout{" "}
            </Link>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {" "}
            {loadingFreelancers
              ? [1, 2, 3].map((n) => <CardSkeleton key={n} />)
              : topFreelancers.map((freelancer) => (
                  <FreelancerCard
                    key={freelancer.id}
                    user={freelancer}
                    // onViewProfile={() => setSelectedFreelancer(freelancer)}
                  />
                ))}{" "}
          </div>{" "}
        </section>
        <TestimonialsSection />
      </main>

      {/* --- AFFICHAGE CONDITIONNEL DU MODAL --- */}
      {/* {selectedFreelancer && (
        <FreelancerProfileModal
          freelancer={selectedFreelancer}
          onClose={handleCloseModal}
        />
      )} */}
    </div>
  );
};

export default Home;
