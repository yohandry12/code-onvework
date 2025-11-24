import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
// 1. IMPORT IMPORTANT : On importe apiService et apiClient depuis votre fichier api.js
// Assurez-vous que le chemin "../api" est correct selon votre structure de dossiers
import { apiService, apiClient } from "../services/api";

const LoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <p>Chargement...</p>
  </div>
);

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    // Nettoyage via apiService
    apiService.clearAuthToken();
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    try {
      // 2. CORRECTION : On utilise apiService.auth.me() au lieu de l'URL en dur
      // Cela utilisera automatiquement l'IP définie dans le .env
      const response = await apiService.auth.me();

      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error("Impossible de rafraîchir la session.", error);
      // Optionnel : ne pas déconnecter immédiatement en cas d'erreur réseau temporaire
      // logout();
    }
  }, [logout]);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("overwork_token");

      if (token) {
        // On configure le token dans l'instance API globale
        apiService.setAuthToken(token);

        try {
          // 3. CORRECTION : Utilisation de l'instance configurée
          const response = await apiService.auth.me();

          if (response.success) {
            setUser(response.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Session invalide ou expirée.", error);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [logout]);

  const login = useCallback(
    (userData, token) => {
      // Utilisation du helper centralisé
      apiService.setAuthToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      switch (userData.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "client":
          navigate("/dashboard");
          break;
        case "candidate":
        default:
          navigate("/dashboard");
          break;
      }
    },
    [navigate]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
