import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  ShieldCheckIcon,
  UsersIcon,
  StarIcon,
  FlagIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
} from "@heroicons/react/24/outline";

const AdminDropdownMenu = ({ user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = user.profile?.firstName ?? "Admin";
  const lastName = user.profile?.lastName ?? "";
  const initials = (
    firstName.charAt(0) + (lastName.charAt(0) || "")
  ).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
      >
        <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">{initials}</span>
        </div>
        <span className="hidden sm:block">Bonjour, {firstName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900 truncate">
                {firstName} {lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <NavLink
              to="/admin/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Dashboard
              </div>
            </NavLink>
            <NavLink
              to="/admin/users"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <UsersIcon className="w-5 h-5 mr-2" />
                Utilisateurs
              </div>
            </NavLink>
            <NavLink
              to="/admin/testimonials"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <StarIcon className="w-5 h-5 mr-2" />
                Témoignages
              </div>
            </NavLink>
            <NavLink
              to="/admin/reports"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FlagIcon className="w-5 h-5 mr-2" />
                Signalements
              </div>
            </NavLink>

            <div className="border-t my-1"></div>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <div className="flex items-center">
                <LogoutIcon className="w-5 h-5 mr-2" />
                Déconnexion
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDropdownMenu;
