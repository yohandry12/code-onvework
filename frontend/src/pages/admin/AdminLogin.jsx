import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { motion } from "framer-motion";

const AdminLogin = () => {
  // Les états sont les mêmes que pour le login normal
  const [formData, setFormData] = useState({ email: "", password: "" });
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
    setLoading(true);

    try {
      // --- MODIFICATION CLÉ : On appelle la nouvelle route ---
      const API_URL = "http://localhost:4000/api/auth/admin/login";
      const response = await axios.post(API_URL, formData);

      if (response.data.success) {
        // La logique de succès est la même
        login(response.data.user, response.data.token);
        navigate("/admin/dashboard"); // Le contexte redirigera vers le bon dashboard admin
      }
    } catch (err) {
      setApiError(err.response?.data?.error || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // --- LE JSX EST PRESQUE IDENTIQUE, ON A JUSTE ADAPTÉ LES TEXTES ---
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl"
      >
        <div className="px-8 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Espace Administration
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            Connexion réservée aux administrateurs.
          </p>
        </div>

        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl"
                placeholder="Email administrateur"
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl"
                placeholder="Mot de passe"
              />
            </div>
            {apiError && (
              <div className="p-3 bg-red-100 rounded-xl text-center">
                <p className="text-red-600 text-sm">{apiError}</p>
              </div>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-slate-900 disabled:opacity-50"
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
