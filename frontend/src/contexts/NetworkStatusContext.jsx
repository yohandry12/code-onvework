import React, { createContext, useState, useEffect, useContext } from "react";

// 1. Créer le contexte
const NetworkStatusContext = createContext();

// 2. Créer le Provider (le composant qui gérera la logique)
export const NetworkStatusProvider = ({ children }) => {
  // On initialise l'état avec l'état actuel du navigateur
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Fonctions pour mettre à jour l'état
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // On écoute les événements du navigateur
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // TRÈS IMPORTANT : On nettoie les écouteurs d'événements
    // quand le composant est démonté pour éviter les fuites de mémoire.
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // On rend le composant Provider en lui passant la valeur de l'état
  return (
    <NetworkStatusContext.Provider value={isOnline}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

// 3. Créer un "custom hook" pour consommer facilement le contexte
// Cela évite d'avoir à importer useContext et NetworkStatusContext partout.
export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error(
      "useNetworkStatus doit être utilisé à l'intérieur d'un NetworkStatusProvider"
    );
  }
  return context;
};
