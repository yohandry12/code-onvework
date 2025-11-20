// src/hooks/useDebounce.js
import { useState, useEffect } from "react";

// Ce hook prend une valeur (ce que l'utilisateur tape) et un délai
export function useDebounce(value, delay) {
  // État pour stocker la valeur "débattue"
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Met en place un minuteur pour mettre à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoie le minuteur si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Se ré-exécute uniquement si la valeur ou le délai change

  return debouncedValue;
}
