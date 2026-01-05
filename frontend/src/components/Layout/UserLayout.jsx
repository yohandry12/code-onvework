import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Squares2X2Icon,
  BriefcaseIcon,
  UserCircleIcon,
  DocumentTextIcon,
  WalletIcon,
  AcademicCapIcon,
  PlusIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const UserLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- CONFIGURATION DES MENUS PAR RÔLE ---
  const getMenus = (role) => {
    const common = [
      { path: "/dashboard", label: "Tableau de bord", icon: Squares2X2Icon },
    ];

    const candidate = [
      {
        path: "/jobs",
        label: "Trouver une mission",
        icon: MagnifyingGlassIcon,
      },
      {
        path: "/my-applications",
        label: "Mes Candidatures",
        icon: DocumentTextIcon,
      },
      { path: "/trainings", label: "Se Former", icon: AcademicCapIcon },
      { path: "/wallet", label: "Portefeuille", icon: WalletIcon },
    ];

    const client = [
      { path: "/jobs/create", label: "Publier une offre", icon: PlusIcon },
      { path: "/talents", label: "Trouver des Talents", icon: UserCircleIcon },
      {
        path: "/manage-applications",
        label: "Candidatures Reçues",
        icon: DocumentTextIcon,
      },
      { path: "/client/job-history", label: "Historique", icon: ChartBarIcon },
    ];

    const trainer = [
      { path: "/my-trainings", label: "Mes Formations", icon: AcademicCapIcon },
      { path: "/courses/create", label: "Créer un cours", icon: PlusIcon },
      { path: "/trainer/wallet", label: "Revenus & Wallet", icon: WalletIcon },
    ];

    const footer = [
      { path: "/profile", label: "Mon Profil", icon: UserCircleIcon },
      { path: "/settings", label: "Paramètres", icon: Cog6ToothIcon },
    ];

    let specificMenu = [];
    if (role === "candidate") specificMenu = candidate;
    if (role === "client") specificMenu = client;
    if (role === "trainer") specificMenu = trainer;

    return [...common, ...specificMenu, ...footer];
  };

  const menuItems = getMenus(user?.role);

  // Persistance de l'état collapsed
  useEffect(() => {
    const savedState = localStorage.getItem("userSidebarCollapsed");
    if (savedState) setIsSidebarCollapsed(JSON.parse(savedState));
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("userSidebarCollapsed", JSON.stringify(newState));
  };

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logout();
      navigate("/login");
    }
  };

  // Composant Lien
  const NavItem = ({ item, isCollapsed }) => {
    const isActive = location.pathname === item.path; // Correspondance exacte ou startWith selon besoin

    return (
      <NavLink
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium my-1
          ${
            isActive
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
          }
          ${isCollapsed ? "justify-center" : ""}
        `}
      >
        <item.icon
          className={`w-6 h-6 flex-shrink-0 ${
            isActive
              ? "text-white"
              : "text-slate-400 group-hover:text-indigo-600"
          }`}
        />

        {!isCollapsed && (
          <span className="whitespace-nowrap overflow-hidden transition-all duration-300 origin-left">
            {item.label}
          </span>
        )}

        {/* Tooltip */}
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-lg">
            {item.label}
            <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-800"></div>
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden font-sans text-slate-800">
      {/* --- SIDEBAR DESKTOP --- */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 h-full shadow-sm z-20 transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? "w-20" : "w-72"}
        `}
      >
        {/* Header Sidebar */}
        <div
          className={`h-20 flex items-center border-b border-slate-100 ${
            isSidebarCollapsed ? "justify-center px-0" : "justify-between px-6"
          }`}
        >
          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isCollapsed={isSidebarCollapsed}
            />
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-slate-100 bg-white">
          {isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="w-full flex justify-center p-2 mb-4 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}

          <div
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
              isSidebarCollapsed
                ? "justify-center"
                : "bg-slate-50 border border-slate-100"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user?.profile?.avatar ? (
                <img
                  src={`http://localhost:4000${user.profile.avatar}`}
                  className="w-full h-full object-cover"
                  alt="Avatar"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold">
                  {user?.profile?.firstName?.charAt(0)}
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">
                  {user?.profile?.firstName}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">
                  {user?.role}
                </p>
              </div>
            )}

            {!isSidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex justify-center p-2 text-slate-400 hover:text-red-600"
            >
              <ArrowLeftOnRectangleIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </aside>

      {/* --- SIDEBAR MOBILE --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6 px-2">
              <span className="text-xl font-bold text-indigo-900">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-1 flex-1">
              {menuItems.map((item) => (
                <NavItem key={item.path} item={item} isCollapsed={false} />
              ))}
            </nav>
            <div className="mt-auto border-t border-slate-100 pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-red-600 bg-red-50 rounded-xl font-medium"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENU --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16  backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {menuItems.find((i) => location.pathname === i.path)?.label ||
                "Espace Membre"}
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
