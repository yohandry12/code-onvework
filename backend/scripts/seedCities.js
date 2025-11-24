const { sequelize, City } = require("../src/models");
const fs = require("fs");
const path = require("path");

// Fonction utilitaire pour créer le slug si manquant
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Sépare les accents
    .replace(/[\u0300-\u036f]/g, "") // Enlève les accents
    .replace(/\s+/g, "-") // Remplace les espaces par -
    .replace(/[^\w-]+/g, "") // Enlève les caractères spéciaux
    .replace(/--+/g, "-") // Remplace les tirets multiples
    .trim();
};

const seedCities = async () => {
  try {
    // 1. Connexion à la BDD
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données réussie.");

    // 2. Lecture du fichier JSON
    const citiesPath = path.join(__dirname, "../src/data/cameroon_cities.json");
    const citiesData = JSON.parse(fs.readFileSync(citiesPath, "utf-8"));

    console.log(`📦 ${citiesData.length} villes trouvées dans le JSON.`);

    // 3. Nettoyage des doublons dans le JSON avant insertion
    // On utilise un Map pour garder uniquement la dernière occurrence de chaque slug
    const uniqueCitiesMap = new Map();
    citiesData.forEach((city) => {
      // S'assurer que le slug existe
      if (!city.slug) city.slug = createSlug(city.name);
      uniqueCitiesMap.set(city.slug, city);
    });

    const uniqueCities = Array.from(uniqueCitiesMap.values());
    console.log(
      `🧹 Après nettoyage des doublons : ${uniqueCities.length} villes uniques à traiter.`
    );

    // 4. Insertion en masse (Bulk Upsert)
    // updateOnDuplicate : Si le slug existe déjà, on met à jour les infos
    await City.bulkCreate(uniqueCities, {
      updateOnDuplicate: ["name", "region", "department", "updated_at"],
      ignoreDuplicates: true, // Alternative pour Postgres (dépend de votre BDD)
    });

    console.log("✅ Importation des villes terminée avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding :");
    console.error(error);
    process.exit(1);
  }
};

seedCities();
