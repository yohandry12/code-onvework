import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { useDebounce } from "use-debounce";
import { formatPoints } from "../utils/format";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  PlayCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { Clock } from "lucide-react";

const AllTrainings = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false); // Mobile

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.trainings.publicTrainings({
        params: {
          page,
          limit: 10, // Liste verticale, on en affiche moins par page
          search: debouncedSearch,
          category: selectedCategory,
          level: selectedLevel,
          priceType: priceFilter,
        },
      });

      if (response.success) {
        setTrainings(response.trainings);
        setTotalPages(Math.ceil(response.total / 10));
      }
    } catch (error) {
      console.error("Erreur chargement cours:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, selectedLevel, priceFilter]);

  useEffect(() => {
    fetchTrainings();
    window.scrollTo(0, 0);
  }, [fetchTrainings]);

  // Helper pour l'image
  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/300x170?text=No+Image";
    if (path.startsWith("http")) return path;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    return `${apiUrl.replace(/\/api$/, "")}${path}`;
  };

  const renderRating = (rating, count) => {
    const numRating = parseFloat(rating) || 0;
    return (
      <div className="flex items-center text-sm font-bold text-yellow-700">
        <span className="mr-1">{numRating.toFixed(1)}</span>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-3.5 h-3.5 ${
                i < Math.round(numRating) ? "text-yellow-500" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-gray-500 font-normal ml-1 text-xs">
          ({count || 0})
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      {/* HEADER SIMPLE */}
      <div className="bg-emerald-900 text-white py-10 px-4 mb-8">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Apprenez sans limites
          </h1>
          <p className="text-emerald-100 mb-6 text-lg">
            Développez de nouvelles compétences pour atteindre vos objectifs
            professionnels.
          </p>
          {/* Barre de recherche intégrée */}
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Que voulez-vous apprendre ?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 shadow-xl"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 flex gap-8">
        {/* --- SIDEBAR FILTRES (Style Udemy) --- */}
        <aside className={`w-64 flex-shrink-0 hidden lg:block space-y-6 pr-4`}>
          {/* Filtre Niveau */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-bold text-gray-900 mb-3 text-base">Niveau</h3>
            <div className="space-y-2">
              {["Débutant", "Intermédiaire", "Avancé", "Tous niveaux"].map(
                (lvl) => (
                  <label
                    key={lvl}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="level"
                      checked={selectedLevel === lvl}
                      onChange={() =>
                        setSelectedLevel(selectedLevel === lvl ? "" : lvl)
                      }
                      className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">{lvl}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Filtre Catégorie */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-bold text-gray-900 mb-3 text-base">
              Catégorie
            </h3>
            <div className="space-y-2">
              {["Développement", "Design", "Marketing", "Business"].map(
                (cat) => (
                  <label
                    key={cat}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() =>
                        setSelectedCategory(selectedCategory === cat ? "" : cat)
                      }
                      className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Filtre Prix */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-bold text-gray-900 mb-3 text-base">Prix</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "paid"}
                  onChange={() => setPriceFilter("paid")}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="text-sm text-gray-700">Payant</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "free"}
                  onChange={() => setPriceFilter("free")}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="text-sm text-gray-700">Gratuit</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceFilter === "all"}
                  onChange={() => setPriceFilter("all")}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="text-sm text-gray-700">Tout</span>
              </label>
            </div>
          </div>
        </aside>

        {/* --- LISTE PRINCIPALE --- */}
        <div className="flex-grow">
          {/* Header Liste */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl text-gray-900">
              {trainings.length} résultats
            </h2>
            {/* Bouton filtres mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center px-4 py-2 border border-black font-bold text-sm"
            >
              <FunnelIcon className="w-4 h-4 mr-2" /> Filtres
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Aucune formation trouvée.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedLevel("");
                }}
                className="mt-4 text-indigo-600 underline font-bold"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {trainings.map((course) => (
                <Link
                  to={`/trainings/${course.id}`}
                  key={course.id}
                  className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-4 group hover:bg-gray-50 transition p-2 rounded-lg"
                >
                  {/* Image (Gauche) */}
                  <div className="w-full sm:w-64 h-36 flex-shrink-0 relative">
                    <img
                      src={getImageUrl(course.thumbnail)}
                      alt={course.title}
                      className="w-full h-full object-cover border border-gray-200 rounded-sm"
                    />
                    {course.level === "Débutant" && (
                      <span className="absolute top-2 left-2 bg-yellow-200 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 uppercase shadow-sm">
                        Débutant
                      </span>
                    )}
                  </div>

                  {/* Contenu (Centre) */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 group-hover:underline decoration-black">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                        {course.description ||
                          "Pas de description courte disponible."}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        {course.trainer?.trainerProfile?.firstName ||
                          "Formateur"}{" "}
                        {course.trainer?.trainerProfile?.lastName}
                      </p>

                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Clock size={18} /> Durée : {course.duration} heures au
                        total
                      </p>

                      {/* Rating & Stats */}
                      <div className="flex items-center gap-2 mb-1">
                        {renderRating(
                          course.averageRating,
                          course.totalStudents
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {course.totalLessons > 0 ? (
                          <span>{course.totalLessons} leçons</span>
                        ) : null}
                        <span>•</span>
                        <span>{course.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prix (Droite) */}
                  <div className="flex flex-col items-end justify-start sm:w-32 flex-shrink-0">
                    <span className="font-bold text-lg text-gray-900">
                      {formatPoints(course.price)}
                    </span>
                    {course.discountPrice > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPoints(course.discountPrice)}
                      </span>
                    )}
                    {course.status === "published" && (
                      <div className="mt-2 hidden sm:block">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded">
                          Meilleure vente
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`w-10 h-10 rounded-full font-bold transition-colors ${
                    page === idx + 1
                      ? "bg-black text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllTrainings;
