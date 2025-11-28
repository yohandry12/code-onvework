import React, { useEffect, useState, useCallback } from "react";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import TalentCard from "../components/UI/TalentCard"; 
import {
  MagnifyingGlassIcon as SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// --- Pagination (Inchangé) ---
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-4 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <span className="font-medium">
        Page {currentPage} sur {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const AllTalents = () => {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch des talents
  const fetchTalents = useCallback(async (page, query) => {
    try {
      setLoading(true);
      const response = await apiService.users.search(
        query,
        "candidate",
        page,
        12
      );
      setTalents(response.users || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setError("");
    } catch (err) {
      setError(
        "Impossible de charger les talents. Veuillez réessayer plus tard."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Premier chargement
  useEffect(() => {
    fetchTalents(1, "");
  }, [fetchTalents]);

  // Recherche avec délai (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTalents(1, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchTalents]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchTalents(newPage, searchTerm);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <div className="text-center md:text-left mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Découvrez nos Freelances
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Trouvez le talent parfait pour votre prochain projet.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        </div>

        {/* Grille de résultats */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold">{error}</p>
          </div>
        ) : talents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {talents.map((talent) => (
                // On affiche juste la carte. C'est elle qui gère le clic maintenant.
                <TalentCard
                  key={talent.id}
                  talent={talent}
                />
              ))}
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">
              Aucun talent ne correspond à votre recherche.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTalents;