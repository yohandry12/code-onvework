const { PlatformSetting } = require("../models");

const getDistributionRates = async () => {
  try {
    const settings = await PlatformSetting.findAll();

    // Convertir en objet facile à lire
    const rates = {};
    settings.forEach((s) => (rates[s.key] = s.value));

    // Fallback si la BDD est vide (sécurité)
    return {
      candidate: (rates["rate_candidate"] || 70) / 100,
      training: (rates["rate_training"] || 20) / 100,
      platform: (rates["rate_platform"] || 10) / 100,
    };
  } catch (error) {
    console.error("Erreur chargement taux:", error);
    return { candidate: 0.7, training: 0.2, platform: 0.1 }; // Valeurs par défaut
  }
};

module.exports = { getDistributionRates };
