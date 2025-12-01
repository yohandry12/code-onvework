import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import ApplicationForm from "../pages/ApplicationForm";
import { useAuth } from "../contexts/AuthContext";
import Toast from "../components/UI/Toast";
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  MapPinIcon, // Ajout de l'icône
} from "@heroicons/react/24/outline";
import { Flame, Star, Sparkles } from "lucide-react";

// --- JobCard (Inchangé) ---
const JobCard = ({ job, onApply }) => {
  const isCompleted = job.status === "filled";
  const isRepublished = !!job.clonedFromId;
  const isFrozen = job.isFrozen;
  const isInProgress = job.status === "in_progress";

  // --- 2. RÉCUPÉRATION DES NOUVELLES PROPS ---
  const isFeatured = job.featured;
  const isUrgent = job.isUrgent;

  const formatBudget = (min, max, currency) => {
    if (!min && !max) return "N/A";
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    return `${minNum.toLocaleString("fr-FR")} - ${maxNum.toLocaleString(
      "fr-FR"
    )} ${currency || ""}`;
  };

  // --- 3. CALCUL DU STYLE DU CONTENEUR ---
  // Par défaut : Blanc classique
  let containerStyle =
    "bg-white border-gray-200 hover:border-blue-500 hover:shadow-md";

  // Logique de priorité visuelle :
  if (isCompleted || isFrozen) {
    // Si fini ou gelé : Gris / Désactivé
    containerStyle = "bg-gray-50 border-gray-200 opacity-80";
  } else if (isUrgent) {
    // Si Urgent : Teinte rouge légère + Bordure rouge
    containerStyle =
      "bg-red-50/40 border-red-200 hover:border-red-400 hover:shadow-red-100 hover:shadow-md";
  } else if (isFeatured) {
    // Si Vedette : Teinte dorée légère + Bordure ambre
    containerStyle =
      "bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:shadow-amber-100 hover:shadow-md";
  }

  return (
    <div
      className={`p-6 rounded-xl border transition-all duration-300 flex flex-col relative overflow-hidden ${containerStyle}`}
    >
      {/* --- EFFET DÉCORATIF POUR LES MISSIONS VEDETTES --- */}
      {isFeatured && !isCompleted && !isFrozen && (
        <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none rotate-12">
          <Sparkles className="w-32 h-32 text-amber-500" />
        </div>
      )}

      <div className="flex justify-between items-start z-10">
        <div className="flex-1">
          {/* Ligne des badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-md">
              {job.experience || "Tout niveau"}
            </p>

            {/* BADGE URGENT */}
            {isUrgent && !isCompleted && !isFrozen && (
              <span className="flex items-center bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                <Flame className="w-3 h-3 mr-1 fill-red-500" /> URGENT
              </span>
            )}

            {/* BADGE PREMIUM/VEDETTE */}
            {isFeatured && !isCompleted && !isFrozen && (
              <span className="flex items-center bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-200">
                <Star className="w-3 h-3 mr-1 fill-amber-500" /> PREMIUM
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3
              className={`text-lg font-bold line-clamp-1 ${
                isCompleted
                  ? "text-gray-500"
                  : "text-gray-900 hover:text-blue-600"
              }`}
            >
              <Link to={`/jobs/${job.id}`}>{job.title}</Link>
            </h3>

            {/* Badges de statut existants */}
            {isRepublished && (
              <span className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                <ArrowPathIcon className="w-3 h-3 mr-1" /> Republiée
              </span>
            )}
            {isCompleted && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                Terminée
              </span>
            )}
            {isFrozen && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full">
                Signalé
              </span>
            )}
            {isInProgress && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                En cours
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
          {new Date(job.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </div>

      <p
        className={`text-sm my-3 line-clamp-2 ${
          isCompleted ? "text-gray-500" : "text-gray-600"
        }`}
      >
        {job.description}
      </p>

      {Array.isArray(job.skills) && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 z-10 relative">
          {job.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="bg-white/80 border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-gray-200/60 pt-4 mt-auto z-10 relative">
        <div className="flex items-center gap-4">
          <p
            className={`text-lg font-bold ${
              isCompleted
                ? "text-gray-500"
                : isFeatured
                ? "text-amber-600"
                : "text-blue-600"
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
          className={`font-semibold px-6 py-2 rounded-lg transition-all text-sm shadow-sm
            ${
              isCompleted || isFrozen || isInProgress
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : isUrgent
                ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-red-200" // Bouton rouge urgent
                : "bg-amber-500 text-white hover:bg-amber-500"
            }
          `}
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

// --- COMPOSANT FilterSidebar AVEC AUTOCOMPLETE VILLE ---
const FilterSidebar = ({ onFilterChange, categories }) => {
  const [filters, setFilters] = useState({
    category: "",
    experienceLevel: [],
    minBudget: "",
    maxBudget: "",
    city: "", // Ajout du champ ville
  });

  // États pour l'autocomplétion des villes
  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null); // Pour détecter le clic en dehors

  // 1. Charger toutes les villes au montage
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await apiService.cities.getAll();
        // On stocke juste les noms des villes pour simplifier la recherche
        const cityNames = (response.data || []).map((c) => c.name);
        setAllCities(cityNames);
      } catch (err) {
        console.error("Erreur chargement villes:", err);
      }
    };
    fetchCities();
  }, []);

  // 2. Gestionnaire de changement de l'input ville
  const handleCityChange = (e) => {
    const userInput = e.target.value;
    setFilters((prev) => ({ ...prev, city: userInput }));

    if (userInput.length > 0) {
      // Filtrer les villes qui contiennent la saisie (insensible à la casse)
      const filtered = allCities.filter((city) =>
        city.toLowerCase().includes(userInput.toLowerCase())
      );
      setCitySuggestions(filtered.slice(0, 5)); // Limiter à 5 suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 3. Sélection d'une ville dans la liste
  const selectCity = (cityName) => {
    setFilters((prev) => ({ ...prev, city: cityName }));
    setShowSuggestions(false);
  };

  // 4. Fermer la liste si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

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
  const debouncedCity = useDebounce(filters.city, 500); // Debounce pour la ville aussi

  const memoizedOnFilterChange = useCallback(onFilterChange, [onFilterChange]);

  useEffect(() => {
    const apiFilters = {
      category: filters.category,
      experience: filters.experienceLevel.join(","),
      minBudget: debouncedMinBudget,
      maxBudget: debouncedMaxBudget,
      city: debouncedCity, // On envoie la ville à l'API
    };
    memoizedOnFilterChange(apiFilters);
  }, [
    filters.category,
    filters.experienceLevel,
    debouncedMinBudget,
    debouncedMaxBudget,
    debouncedCity,
    memoizedOnFilterChange,
  ]);

  const resetFilters = () => {
    setFilters({
      category: "",
      experienceLevel: [],
      minBudget: "",
      maxBudget: "",
      city: "",
    });
    setShowSuggestions(false);
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

        {/* --- NOUVEAU FILTRE VILLE --- */}
        <div className="mb-6 relative" ref={wrapperRef}>
          <h4 className="font-semibold mb-3 text-gray-700">Ville</h4>
          <div className="relative">
            <input
              type="text"
              placeholder="Ex: Douala, Yaoundé..."
              value={filters.city}
              onChange={handleCityChange}
              onFocus={() => filters.city && setShowSuggestions(true)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <MapPinIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Liste de suggestions */}
          {showSuggestions && citySuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
              {citySuggestions.map((cityName, index) => (
                <li
                  key={index}
                  onClick={() => selectCity(cityName)}
                  className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700"
                >
                  {cityName}
                </li>
              ))}
            </ul>
          )}
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

// --- COMPOSANT PRINCIPAL (Peu de changements, juste la réception du filtre) ---
const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [activeJobToApply, setActiveJobToApply] = useState(null);
  const [toast, setToast] = useState(null);

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
        // Nettoyage des clés vides
        Object.keys(allFilters).forEach((key) => {
          if (
            allFilters[key] === "" ||
            allFilters[key] === null ||
            allFilters[key] === undefined
          ) {
            delete allFilters[key];
          }
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

  const handleApplyClick = (job) => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setActiveJobToApply(job);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b py-8 top-16 z-30">
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
                    onApply={() => handleApplyClick(job)}
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
            setToast({ type: "success", message: "Candidature envoyée !" });
          }}
        />
      )}

      {toast && (
        <Toast toast={toast} onClose={() => setToast(null)} duration={4000} />
      )}
    </div>
  );
};

export default Jobs;
