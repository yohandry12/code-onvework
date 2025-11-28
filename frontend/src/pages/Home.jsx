import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// 1. IMPORT DU BON COMPOSANT TALENTCARD
import TalentCard from "../components/UI/TalentCard"; 
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

  useEffect(() => {
    let mounted = true;
    setLoadingJobs(true);
    setLoadingFreelancers(true);

    Promise.allSettled([
      apiService.jobs.getAll({ limit: 6 }),
      apiService.users.search("", "candidate", 1, 6),
    ]).then(([jobsRes, usersRes]) => {
      if (!mounted) return;

      if (jobsRes.status === "fulfilled") {
        setFeaturedJobs(jobsRes.value.jobs || []);
      }
      setLoadingJobs(false);

      if (usersRes.status === "fulfilled") {
        setTopFreelancers(usersRes.value.users || []);
      }
      setLoadingFreelancers(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

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

        {/* Talents recommandés */}
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
                  <TalentCard
                    key={freelancer.id}
                    talent={freelancer} 
                  />
                ))}
          </div>
        </section>
        <TestimonialsSection />
      </main>
    </div>
  );
};

export default Home;