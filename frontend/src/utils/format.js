// src/utils/format.js

// Convertit un prix FCFA en string affichable pour le candidat (en Points)
export const formatPoints = (amountInFcfa) => {
  if (!amountInFcfa || amountInFcfa === 0) return "Gratuit";
  // Taux de conversion : 1 FCFA = 1 Point
  // Math.ceil pour éviter les décimales bizarres
  const points = Math.ceil(Number(amountInFcfa));
  return `${points.toLocaleString("fr-FR")} Pts`;
};

// Formateur de devise classique (pour le dashboard formateur)
export const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "Gratuit";
  return `${Number(amount).toLocaleString("fr-FR")} FCFA`;
};
