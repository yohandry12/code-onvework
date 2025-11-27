import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";

// --- 1. FONCTION UTILITAIRE (La même que dans TalentCard) ---
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;

  const apiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = apiUrl.replace(/\/api$/, "");
  const cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;

  return `${baseUrl}${cleanPath}`;
};

const UserDropdownMenu = ({ user, logout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Extraction des données du profil
  const profile = user.candidateProfile || user.clientProfile || user.adminProfile || user.profile || {};
  const firstName = profile.firstName || "User";
  const lastName = profile.lastName || "";
  
  // Construction du nom complet pour l'API ui-avatars
  const fullName = `${firstName} ${lastName}`.trim();

  
  // A. On prépare l'URL de secours (Initiales via ui-avatars)

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=128`;

  // B. On prépare l'URL principale (Base de données)
  const dbAvatarUrl = getAvatarUrl(profile.avatar);

  // C. On décide quelle URL utiliser par défaut
 
  const avatarSrc = dbAvatarUrl 
    ? `${dbAvatarUrl}?t=${new Date().getTime()}` 
    : fallbackAvatar;

  // Gestion de la fermeture au clic dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <div className="flex items-center space-x-4">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md px-2 py-1"
        >
          {/* --- 3. AFFICHAGE DE L'IMAGE (Style TalentCard) --- */}
          {/* Plus besoin de condition ternaire complexe, on affiche toujours une image */}
          <img
            src={avatarSrc}
            alt={fullName}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 bg-gray-100"
            onError={(e) => {
              // Si l'image principale plante, on la remplace par l'image des initiales
              e.target.onerror = null;
              e.target.src = fallbackAvatar;
            }}
          />

          <span className="hidden sm:inline">Bonjour, {firstName}</span>

          <svg
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{firstName} {lastName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              <NavLink
                to="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                Mon Profil
              </NavLink>

              <NavLink
                to="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                Paramètres
              </NavLink>

              <div className="border-t border-gray-100 my-1"></div>

              <NavLink
                to="/help"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                Aide & Support
              </NavLink>

              <button
                onClick={() => { logout(); setIsDropdownOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDropdownMenu;