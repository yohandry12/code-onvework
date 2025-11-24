// --- START OF FILE Login.jsx ---

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
// 1. IMPORT : On remplace axios par apiService
// Vérifiez si le chemin est "../api" ou "../services/api" selon votre dossier
import { apiService } from "../services/api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // On nettoie les espaces éventuels (fréquent sur mobile)
    const emailClean = formData.email.trim();
    const passwordClean = formData.password;

    if (!emailClean || !passwordClean) {
      setApiError("L'email et le mot de passe sont requis.");
      return;
    }

    setLoading(true);

    try {
      // 2. CORRECTION : On utilise apiService au lieu de axios + localhost
      // apiService utilise automatiquement l'IP configurée dans api.js / .env
      const response = await apiService.auth.login(emailClean, passwordClean);

      // Note : L'intercepteur dans api.js renvoie déjà response.data
      // Donc 'response' contient directement l'objet { success: true, user: ..., token: ... }
      if (response.success) {
        login(response.user, response.token);
        // La navigation est gérée dans login(), mais on peut laisser ça ici par sécurité
        // navigate("/dashboard");
      }
    } catch (err) {
      console.error("Erreur Login:", err);
      // Gestion d'erreur améliorée
      const message =
        err.response?.data?.error ||
        err.message ||
        "Une erreur est survenue lors de la connexion.";

      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-white/20 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white"
          >
            Bienvenue !
          </motion.h2>
          <p className="mt-2 text-indigo-100 text-sm">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="font-semibold text-white hover:text-indigo-200 underline underline-offset-2 transition-colors"
            >
              Inscrivez-vous ici
            </Link>
          </p>
        </div>

        <div className="px-8 py-10">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-indigo-400 focus:bg-white transition-all duration-200"
                placeholder="Adresse email"
              />
            </div>

            <div className="space-y-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-indigo-400 focus:bg-white transition-all duration-200"
                placeholder="Mot de passe"
              />
            </div>

            {apiError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-center"
              >
                <p className="text-red-600 text-sm font-medium">{apiError}</p>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
