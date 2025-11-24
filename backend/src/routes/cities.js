const express = require("express");
const router = express.Router();
const db = require("../models");
const { Op } = require("sequelize");

/**
 * Routes `cities`
 * ----------------
 * Objectif : fournir une API simple pour consulter la liste des villes
 * du Cameroun, récupérer les détails d'une ville et obtenir le nombre
 * de candidats enregistrés dans une ville.
 *
 * Emplacement : `GET /api/cities` (liste / recherche)
 *               `GET /api/cities/:id` (détails)
 *               `GET /api/cities/:id/count-candidates` (compte)
 *
 * Conventions et remarques :
 * - Ce fichier utilise le modèle Sequelize `City` exposé par `../models`.
 * - Les recherches simples sont faites avec `LIKE` sur `name`, `slug` et `region`.
 * - `city_id` dans `CandidateProfile` est la FK utilisée pour compter les candidats.
 * - La route est volontairement sans authentification pour permettre
 *   l'autocomplete public côté frontend. Si besoin, ajouter un middleware auth.
 *
 * Exemples d'utilisation :
 * - Recherche autocomplete : GET /api/cities?q=doua&limit=10
 * - Détails ville : GET /api/cities/2
 * - Nombre candidats : GET /api/cities/2/count-candidates
 *
 * Conseils d'évolution :
 * - Paginer les résultats et retourner un champ `hasMore` pour le frontend.
 * - Ajouter un champ `candidateCount` dans la réponse de `GET /api/cities`
 *   via un LEFT JOIN + GROUP BY si souhaité, ou utiliser un cache Redis.
 */

// GET /api/cities?q=&limit=&offset=
/**
 * GET /api/cities
 * Query params:
 *  - q: string (optionnel) recherche partielle sur name|slug|region
 *  - limit: number (optionnel) nombre d'items retournés (défaut 30)
 *  - offset: number (optionnel) pagination offset
 *
 * Response (200): { data: Array<City>, total: Number }
 *  - City: { id, name, slug, region, department, lat, lng, population, createdAt }
 */
router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = parseInt(req.query.limit, 10) || 30;
    const offset = parseInt(req.query.offset, 10) || 0;

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
        { region: { [Op.like]: `%${q}%` } },
      ];
    }

    // findAndCountAll fournit les lignes + le compte total pour la pagination
    const { rows, count } = await db.City.findAndCountAll({
      where,
      order: [["name", "ASC"]],
      limit,
      offset,
    });

    res.json({ data: rows, total: count });
  } catch (err) {
    next(err);
  }
});

// GET /api/cities/:id
/**
 * GET /api/cities/:id
 * Params:
 *  - id: number (identifiant de la ville)
 *
 * Response (200): City object
 * Response (404): { error: 'City not found' }
 */
router.get("/:id", async (req, res, next) => {
  try {
    const city = await db.City.findByPk(req.params.id);
    if (!city) return res.status(404).json({ error: "City not found" });
    res.json(city);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cities/:id/count-candidates
 * Retourne le nombre de `CandidateProfile` liés à la ville.
 * Response (200): { cityId: Number, count: Number }
 * Response (400): { error: 'Invalid city id' }
 */
router.get("/:id/count-candidates", async (req, res, next) => {
  try {
    const cityId = parseInt(req.params.id, 10);
    if (isNaN(cityId))
      return res.status(400).json({ error: "Invalid city id" });

    // Note: count() est efficace si `candidate_profiles.city_id` est indexé.
    const count = await db.CandidateProfile.count({ where: { cityId } });
    res.json({ cityId, count });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
