import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Assurez-vous que le chemin est correct
import LoadingSpinner from "../UI/LoadingSpinner"; // Assurez-vous d'avoir ce composant

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth(); // On ne se base que sur 'user' et 'loading'
  const location = useLocation();

  // 1. On attend que la vérification de session soit terminée
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner text="Vérification de la session..." />
      </div>
    );
  }

  // 2. Si la vérification est terminée et qu'il n'y a pas d'utilisateur,
  // on redirige vers la page de connexion.
  if (!user) {
    // On sauvegarde la page d'où vient l'utilisateur pour le rediriger après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si l'utilisateur est connecté, on vérifie son rôle.
  // Si la route requiert des rôles spécifiques ET que le rôle de l'utilisateur n'est pas inclus,
  // on affiche une page d'accès refusé.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <h1 className="text-4xl font-bold text-red-500">Accès Refusé</h1>
        <p className="mt-4 text-gray-600">
          Vous n'avez pas l'autorisation d'accéder à cette page.
        </p>
        <Link
          to="/"
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  // 4. Si tout est bon (utilisateur connecté ET bon rôle), on affiche le contenu de la route.
  return <Outlet />;
};

export default ProtectedRoute;
