import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AdminDropdownMenu from "./AdminDropdownMenu";

const AdminHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Admin Panel</span>
          </Link>

          {/* Espace vide pour centrer le titre si besoin, ou ajouter des liens admin */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Vous pouvez ajouter des liens directs ici si nécessaire */}
            {/* Exemple: <NavLink to="/admin/analytics">Statistiques</NavLink> */}
          </nav>

          {/* Menu Admin */}
          <div className="flex items-center">
            {user && <AdminDropdownMenu user={user} logout={logout} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
