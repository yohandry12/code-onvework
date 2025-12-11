import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserIcon,
  UserGroupIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const MobileMenu = ({ user }) => {
  //  Les differents lien du candidat
  const candidateLinks = [
    { to: "/dashboard", label: "Accueil", icon: HomeIcon },
    { to: "/jobs", label: "Emplois", icon: BriefcaseIcon },
    { to: "/my-applications", label: "Candidatures", icon: DocumentTextIcon },
    { to: "/profile", label: "Profil", icon: UserIcon },
  ];
  // Les differents lien du recruteur(client)
  const clientLinks = [
    { to: "/dashboard", label: "Accueil", icon: HomeIcon },
    { to: "/jobs/create", label: "Publier", icon: PlusIcon },
    { to: "/manage-applications", label: "Candidats", icon: DocumentTextIcon },
    { to: "/talents", label: "Talents", icon: UserGroupIcon },
  ];

<<<<<<< HEAD
  // Choix du menu en fonction du profil de l'utilisateur
  const links =
    user?.role === "client" || user?.role === "candidate"
      ? clientLinks
      : candidateLinks;
=======
    // Choix du menu en fonction du profil de l'utilisateur
    const links = user?.role === "client" 
    ? clientLinks 
    : candidateLinks;
>>>>>>> 9d7c70335e2dbe4ec1903a7ffb6429d3d9381a84

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard"} // Empêche "Accueil" de rester allumé sur les sous-pages
            className={({ isActive }) =>
              `inline-flex flex-col items-center justify-center px-5 group ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* L'icône avec la forme "pillule" si actif  */}
                <div
                  className={`mb-1 transition-all duration-200 ${
                    isActive
                      ? "px-5 py-1 rounded-full bg-blue-100" // La bulle bleue
                      : "px-0 py-0"
                  }`}
                >
                  <link.icon
                    className={`w-6 h-6 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    isActive ? "font-bold" : "font-normal"
                  }`}
                >
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
export default MobileMenu;
