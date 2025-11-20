import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  // La fonction logout est mise en mémoire avec useCallback.
  // Elle ne sera recréée que si `navigate` change (ce qui n'arrive jamais).
  const logout = useCallback(() => {
    localStorage.removeItem("overwork_token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  }, [navigate]);

  // NOUVELLE FONCTION POUR RAFRAÎCHIR L'UTILISATEUR
  const refreshUser = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/auth/me");
      if (response.data.success) {
        setUser(response.data.user);
        // Mettre à jour aussi le localStorage pour la persistance
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error("Impossible de rafraîchir la session.", error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("overwork_token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const response = await axios.get("http://localhost:4000/api/auth/me");
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            logout(); // Le token est invalide, on nettoie
          }
        } catch (error) {
          console.error("Session invalide ou expirée.", error);
          logout(); // Erreur réseau ou autre, on nettoie
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [logout]); // On dépend de `logout` qui est stable grâce à useCallback.

  // La fonction login est aussi mise en mémoire.
  const login = useCallback(
    (userData, token) => {
      localStorage.setItem("overwork_token", token);
      localStorage.setItem("user", JSON.stringify(userData)); // Sauvegarder l'utilisateur est une bonne pratique
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);

      // La redirection se fait maintenant ici, dans le contexte, pour centraliser la logique.
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

  // --- LA CORRECTION PRINCIPALE EST ICI ---
  // useMemo garantit que l'objet `value` n'est pas un nouvel objet à chaque rendu.
  // Il ne change que si `user` ou `loading` change réellement.
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user, // Crée une valeur booléenne simple pour la vérification
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
