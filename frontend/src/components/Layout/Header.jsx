// import React from "react";
// import { Link, NavLink } from "react-router-dom"; // NavLink est souvent meilleur pour la navigation
// import { useAuth } from "../../contexts/AuthContext";
// import UserDropdownMenu from "../Layout/DropMenu";

// const Header = () => {
//   const { user, isAuthenticated, logout } = useAuth();

//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-between h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center space-x-2">
//             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
//               <span className="text-white font-bold text-lg">O</span>
//             </div>
//             <span className="font-bold text-xl text-gray-900">Onvework</span>
//           </Link>

//           {/* Navigation */}
//           <nav className="hidden md:flex items-center space-x-6">
//             <NavLink
//               to="/"
//               className={({ isActive }) =>
//                 isActive
//                   ? "text-blue-600 font-medium"
//                   : "text-gray-600 hover:text-gray-900"
//               }
//             >
//               Accueil
//             </NavLink>
//             <NavLink
//               to="/talents"
//               className={({ isActive }) =>
//                 isActive
//                   ? "text-blue-600 font-medium"
//                   : "text-gray-600 hover:text-gray-900"
//               }
//             >
//               Nos Talents
//             </NavLink>

//             <NavLink
//               to="/jobs"
//               className={({ isActive }) =>
//                 isActive
//                   ? "text-blue-600 font-medium"
//                   : "text-gray-600 hover:text-gray-900"
//               }
//             >
//               Trouver des missions
//             </NavLink>
//           </nav>

//           {/* Section Droite */}
//           <div className="flex items-center space-x-4">
//             {isAuthenticated && user ? (
//               // Remplacer l'ancien menu par le nouveau composant
//               <UserDropdownMenu user={user} logout={logout} />
//             ) : (
//               // --- Menu Utilisateur Déconnecté ---
//               <div className="hidden md:flex items-center space-x-4">
//                 <Link
//                   to="/login"
//                   className="text-sm font-medium text-gray-600 hover:text-gray-900"
//                 >
//                   Connexion
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
//                 >
//                   S'inscrire
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UserDropdownMenu from "../Layout/DropMenu";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Fermer le menu lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Empêcher le scroll quand le menu est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navigationLinks = [
    { to: "/", label: "Accueil" },
    { to: "/talents", label: "Nos Talents" },
    { to: "/jobs", label: "Trouver des missions" },
  ];

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Onvework</span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Section Droite Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <UserDropdownMenu user={user} logout={logout} />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>

            {/* Bouton Burger Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span
                  className={`block h-0.5 w-full bg-gray-600 rounded-full transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-gray-600 rounded-full transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-gray-600 rounded-full transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay sombre */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Menu Mobile Slide-in */}
      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header du menu mobile */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Onvework</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profil utilisateur (si connecté) */}
          {isAuthenticated && user && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-semibold text-lg">
                    {user.firstName?.charAt(0) ||
                      user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            {navigationLinks.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isMobileMenuOpen
                    ? "slideInFromRight 0.3s ease-out forwards"
                    : "none",
                }}
              >
                {link.label}
              </NavLink>
            ))}

            {/* Actions utilisateur mobile */}
            {isAuthenticated && user && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                  <Link
                    to={user.role === "candidate" ? "/dashboard" : "/dashboard"}
                    className="flex items-center px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-gray-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Tableau de bord
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-gray-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mon profil
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </nav>

          {/* Footer du menu (si non connecté) */}
          {!isAuthenticated && (
            <div className="p-6 border-t border-gray-200 space-y-3">
              <Link
                to="/login"
                className="block w-full text-center px-4 py-3 rounded-xl font-medium text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="block w-full text-center px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                S'inscrire gratuitement
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Header;
