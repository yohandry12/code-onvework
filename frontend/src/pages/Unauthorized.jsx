import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Particles from "../components/UI/Particles";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Particules en arrière-plan qui prennent tout l'écran */}
      <div className="absolute inset-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Contenu centré avec fond flouté */}
      <div className="relative z-10 w-full max-w-lg text-center p-8 md:p-12 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
        {/* 4. On s'assure que le texte est blanc */}
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Ooops! Accès non autorisé.
        </h1>
        <p className="text-gray-300 mb-8">
          Il semble que vous n'ayez pas les permissions nécessaires pour accéder
          à cette page.
        </p>

        <div className="space-y-3">
          {user ? (
            <p className="text-sm text-gray-400">
              Vous êtes connecté en tant que{" "}
              <span className="font-semibold text-white">{user.email}</span>{" "}
              (Rôle : {user.role}).
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-200 transition"
            >
              Retourner en arrière
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 border border-white/20 transition"
            >
              Aller à l'accueil
            </Link>
          </div>

          {user && (
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-white underline mt-4"
            >
              Ce n'est pas le bon compte ? Se déconnecter.
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
