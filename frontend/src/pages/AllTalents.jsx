import React, { useEffect, useState, useCallback } from "react";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import TalentCard from "../components/UI/TalentCard";
import {
  MagnifyingGlassIcon as SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Composant pour la pagination
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-4 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
      </button>
      <span className="font-medium text-gray-700">
        Page {currentPage} sur {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

const AllTalents = () => {
  // Plus besoin de user ici pour l'instant, sauf si vous voulez personnaliser l'accueil
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- SUPPRESSION DES ÉTATS DE LA MODALE ---

  // Utilisation de useCallback pour optimiser la fonction de fetch
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

  // Déclencher une nouvelle recherche lorsque l'utilisateur tape (avec un délai)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Revenir à la première page à chaque nouvelle recherche
      fetchTalents(1, searchTerm);
    }, 500); // Délai de 500ms

    return () => clearTimeout(timer);
  }, [searchTerm, fetchTalents]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchTalents(newPage, searchTerm);
    }
  };

  // --- SUPPRESSION DES FONCTIONS handleViewProfile et handleCloseModal ---

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête et barre de recherche */}
        <div className="text-center md:text-left mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Découvrez nos Freelances
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Trouvez le talent parfait pour votre prochain projet.
          </p>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom, compétence ou métier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
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
            <button
              onClick={() => fetchTalents(1, searchTerm)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Réessayer
            </button>
          </div>
        ) : talents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {talents.map((talent) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  // Plus besoin de passer onViewProfile, TalentCard gère la navigation
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
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-500 font-medium">
              Aucun talent ne correspond à votre recherche.
            </p>
            <p className="text-gray-400 mt-2">Essayez d'autres mots-clés.</p>
          </div>
        )}
      </div>

      {/* SUPPRESSION DE LA MODALE ICI */}
    </div>
  );
};

export default AllTalents;
