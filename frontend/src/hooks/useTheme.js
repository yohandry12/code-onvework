import { useState, useEffect } from "react";

export const useTheme = () => {
  // 1. Initialiser le thème depuis localStorage ou utiliser 'light' par défaut
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // 2. Logique pour appliquer le thème
    const applyTheme = (themeToApply) => {
      const isDark =
        themeToApply === "dark" ||
        (themeToApply === "auto" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      root.classList.toggle("dark", isDark);
      localStorage.setItem("theme", themeToApply);
    };

    applyTheme(theme);

    // 3. Écouter les changements du système si le thème est 'auto'
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "auto") {
        applyTheme("auto");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // 4. Nettoyage de l'écouteur
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]); // Cet effet se relance à chaque fois que `theme` change

  return [theme, setTheme];
};
