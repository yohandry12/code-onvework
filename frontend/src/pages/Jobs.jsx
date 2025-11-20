import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import ApplicationForm from "../pages/ApplicationForm";
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// --- COMPOSANT JobCard ENTIÈREMENT CORRIGÉ ---
const JobCard = ({ job, onApply }) => {
  const isCompleted = job.status === "filled";
  const isRepublished = !!job.clonedFromId;
  const isFrozen = job.isFrozen;
  const isInProgress = job.status === "in_progress";

  // Fonction utilitaire pour le budget
  const formatBudget = (min, max, currency) => {
    if (!min && !max) return "N/A";
    // Sequelize renvoie des chaînes de caractères pour les décimaux, on les convertit
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    return `${minNum.toLocaleString("fr-FR")} - ${maxNum.toLocaleString(
      "fr-FR"
    )} ${currency || ""}`;
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg border transition-all duration-300 flex flex-col ${
        isCompleted
          ? "border-gray-200 bg-gray-50"
          : "border-gray-200 hover:border-blue-500 hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 mb-1 capitalize">
            {job.experience || "Tout niveau"}
          </p>
          <div className="flex items-center gap-2">
            <h3
              className={`text-lg font-semibold ${
                isCompleted
                  ? "text-gray-500"
                  : "text-gray-800 hover:text-blue-600"
              }`}
            >
              <Link to={`/jobs/${job.id}`}>{job.title}</Link>
            </h3>
            {/* --- AJOUTER LE BADGE ICI --- */}
            {isRepublished && (
              <span className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Republiée
              </span>
            )}
            {isCompleted && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                Terminée
              </span>
            )}

            {isFrozen && (
              <span className="flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full">
                Signalé
              </span>
            )}

            {isInProgress && (
              <span className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                En cours
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(job.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </div>
      <p
        className={`text-sm my-4 line-clamp-2 ${
          isCompleted ? "text-gray-500" : "text-gray-600"
        }`}
      >
        {job.description}
      </p>

      {Array.isArray(job.skills) && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center border-t pt-4 mt-auto">
        <div className="flex items-center gap-4">
          <p
            className={`text-lg font-bold ${
              isCompleted ? "text-gray-500" : "text-blue-600"
            }`}
          >
            {formatBudget(job.budgetMin, job.budgetMax, job.budgetCurrency)}
          </p>
          <p className="text-sm text-gray-500">
            {job.applicationCount || 0} Candidature(s)
          </p>
        </div>
        <button
          onClick={() => onApply(job)}
          disabled={isCompleted || isFrozen || isInProgress}
          className="font-semibold px-6 py-2 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-gray-800 text-white hover:bg-gray-900"
        >
          {isCompleted
            ? "Mission terminée"
            : isFrozen
            ? "Suspendu"
            : isInProgress
            ? "En cours"
            : "Postuler"}
        </button>
      </div>
    </div>
  );
};

// --- COMPOSANT FilterSidebar (COMPLET ET INCHANGÉ) ---
const FilterSidebar = ({ onFilterChange, categories }) => {
  const [filters, setFilters] = useState({
    category: "",
    experienceLevel: [],
    minBudget: "",
    maxBudget: "",
  });

  const handleCheckboxChange = (group, value) => {
    setFilters((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((item) => item !== value)
        : [...prev[group], value],
    }));
  };

  const handleSelectChange = (e) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  };

  const debouncedMinBudget = useDebounce(filters.minBudget, 500);
  const debouncedMaxBudget = useDebounce(filters.maxBudget, 500);

  // useCallback est utilisé ici pour optimiser
  // Assurer que la callback suit les changements du parent
  const memoizedOnFilterChange = useCallback(onFilterChange, [onFilterChange]);

  useEffect(() => {
    // Le backend attend `experience` (pas `experienceLevel`).
    // On envoie une string CSV (ex: "junior,senior").
    const apiFilters = {
      category: filters.category,
      experience: filters.experienceLevel.join(","),
      minBudget: debouncedMinBudget,
      maxBudget: debouncedMaxBudget,
    };
    memoizedOnFilterChange(apiFilters);
  }, [
    filters.category,
    filters.experienceLevel,
    debouncedMinBudget,
    debouncedMaxBudget,
    memoizedOnFilterChange,
  ]);

  const resetFilters = () => {
    setFilters({
      category: "",
      experienceLevel: [],
      minBudget: "",
      maxBudget: "",
    });
  };

  return (
    <aside className="w-full lg:w-1/4 lg:pr-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-24">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="font-bold text-lg text-gray-900">Filtres</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-indigo-600 font-medium"
          >
            Réinitialiser
          </button>
        </div>
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700">Catégorie</h4>
          <select
            value={filters.category}
            onChange={handleSelectChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700">
            Niveau d'expérience
          </h4>
          <div className="space-y-2">
            {["junior", "intermediate", "senior", "expert"].map((level) => (
              <label key={level} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.experienceLevel.includes(level)}
                  onChange={() =>
                    handleCheckboxChange("experienceLevel", level)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-600 capitalize">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gray-700">Plage de budget</h4>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              value={filters.minBudget}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minBudget: e.target.value }))
              }
              className="w-full p-2 border rounded-md text-sm border-gray-300"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxBudget}
              onChange={(e) =>
                setFilters((f) => ({ ...f, maxBudget: e.target.value }))
              }
              className="w-full p-2 border rounded-md text-sm border-gray-300"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

// --- COMPOSANT PRINCIPAL DE LA PAGE ---
const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [activeJobToApply, setActiveJobToApply] = useState(null);

  const jobCategories = [
    { label: "Développement", value: "development" },
    { label: "Design", value: "design" },
    { label: "Marketing", value: "marketing" },
    { label: "Rédaction", value: "writing" },
    { label: "Consulting", value: "consulting" },
    { label: "Données", value: "data" },
    { label: "Mobile", value: "mobile" },
    { label: "Vidéo", value: "video" },
    { label: "Traduction", value: "translation" },
    { label: "Autre", value: "other" },
  ];

  const fetchJobs = useCallback(
    async (currentFilters, currentPage, isNewSearch) => {
      isNewSearch ? setLoading(true) : setLoadingMore(true);
      setError("");
      try {
        const allFilters = {
          ...currentFilters,
          search: debouncedSearchTerm,
          page: currentPage,
          limit: 10,
        };
        Object.keys(allFilters).forEach((key) => {
          if (!allFilters[key]) delete allFilters[key];
        });
        const response = await apiService.jobs.getAll(allFilters);

        if (response.success) {
          setJobs((prev) =>
            isNewSearch ? response.jobs : [...prev, ...response.jobs]
          );
          setPagination(response.pagination || {});
        } else {
          throw new Error("Réponse de l'API non valide.");
        }
      } catch (err) {
        setError("Erreur lors du chargement des offres.");
      } finally {
        isNewSearch ? setLoading(false) : setLoadingMore(false);
      }
    },
    [debouncedSearchTerm]
  );

  useEffect(() => {
    fetchJobs(filters, 1, true);
  }, [filters, debouncedSearchTerm]);

  const loadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchJobs(filters, pagination.currentPage + 1, false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b py-8 top-16 z-30">
        {" "}
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Trouvez votre prochaine mission
          </h1>
          <p className="mt-2 text-gray-600">
            Explorez des centaines d'opportunités adaptées à vos compétences.
          </p>
          <div className="mt-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par mot-clé, compétence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:flex lg:gap-8">
          <FilterSidebar
            onFilterChange={setFilters}
            categories={jobCategories}
          />
          <div className="w-full mt-8 lg:mt-0">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {pagination.totalResults || 0} résultats affichés
            </h2>
            {loading ? (
              <p className="text-center py-4 text-gray-500">
                Chargement des offres...
              </p>
            ) : error ? (
              <p className="text-center py-4 text-red-500">{error}</p>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-800">
                  Aucune mission ne correspond à vos critères
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Essayez d'ajuster vos filtres de recherche.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApply={setActiveJobToApply}
                  />
                ))}
              </div>
            )}

            {pagination.currentPage < pagination.totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg disabled:bg-indigo-300 hover:bg-indigo-700"
                >
                  {loadingMore ? "Chargement..." : "Charger plus"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {activeJobToApply && (
        <ApplicationForm
          jobId={activeJobToApply.id}
          client={activeJobToApply.client}
          onClose={() => setActiveJobToApply(null)}
          onSubmitted={() => {
            setActiveJobToApply(null);
            alert("Candidature envoyée !");
          }}
        />
      )}
    </div>
  );
};

export default Jobs;
