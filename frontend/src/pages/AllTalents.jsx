import React, { useEffect, useState, useCallback } from "react";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import TalentCard from "../components/UI/TalentCard";
import {
  MagnifyingGlassIcon as SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import FreelancerProfileModal from "../components/UI/FreelancerProfileModal";
import { useAuth } from "../contexts/AuthContext";
// Nouveau composant pour les boutons de pagination
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

const FreelancerCard = ({ user, onViewProfile }) => {
  const title =
    user.profile.profession ||
    (user.profile.skills && user.profile.skills[0]) ||
    "Talent Freelance";
  return (
    <div
      onClick={onViewProfile}
      className="bg-gray-800/50 rounded-2xl border border-white/10 p-6 flex flex-col items-center gap-4 hover:border-emerald-400/50 transition-all duration-300 cursor-pointer"
    >
      <div className="relative">
        <img
          src={
            user.profile.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.profile.fullName
            )}&background=2dd4bf&color=000&bold=true`
          }
          alt={user.profile.fullName}
          className="w-20 h-20 rounded-full object-cover"
        />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">
          {user.profile.fullName}
        </h3>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {user.profile.skills?.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

const AllTalents = () => {
  const { user } = useAuth();
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Nouveaux états pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

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
    // On met un délai (debounce) pour ne pas appeler l'API à chaque touche
    const timer = setTimeout(() => {
      setCurrentPage(1); // Revenir à la première page à chaque nouvelle recherche
      fetchTalents(1, searchTerm);
    }, 500); // Délai de 500ms

    return () => clearTimeout(timer); // Nettoyer le minuteur
  }, [searchTerm, fetchTalents]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchTalents(newPage, searchTerm);
    }
  };

  const handleViewProfile = async (freelancerPreview) => {
    // 1. Indiquer que la modale est en train de charger
    setIsModalLoading(true);
    setSelectedFreelancer(freelancerPreview); // On peut pré-remplir la modale avec les données de base

    try {
      // 2. APPEL CRUCIAL À L'API qui déclenche l'incrémentation du compteur
      const response = await apiService.users.getProfile(freelancerPreview.id);

      // 3. Mettre à jour la modale avec les données complètes et fraîches
      if (response.success) {
        setSelectedFreelancer(response.user);
      } else {
        setError("Impossible de charger le profil détaillé.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors du chargement du profil.");
      console.error(err);
    } finally {
      // 4. Arrêter l'état de chargement de la modale
      setIsModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedFreelancer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête et barre de recherche (inchangés) */}
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
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  onViewProfile={() => handleViewProfile(talent)}
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
      {selectedFreelancer && (
        <FreelancerProfileModal
          freelancer={selectedFreelancer}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AllTalents;
