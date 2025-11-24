const OpenAI = require("openai");
const { Job } = require("../models");
const { Op } = require("sequelize");
const { logger } = require("../utils/logger");

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

/**
 * Analyse un profil de candidat et une liste de missions pour trouver les plus pertinentes.
 * @param {object} candidateProfile - Le profil du candidat (compétences, profession, etc.).
 * @param {Array<object>} availableJobs - Une liste de missions ouvertes.
 * @returns {Promise<Array>} Une liste de jobs recommandés avec une explication.
 */
const findMatchingJobs = async (candidateProfile, availableJobs) => {
  let completion;
  try {
    // On simplifie les données pour ne pas surcharger le prompt
    const simplifiedProfile = {
      profession: candidateProfile.profession,
      skills: candidateProfile.skills,
      bio: candidateProfile.bio?.substring(0, 500),
    };

    const simplifiedJobs = availableJobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description.substring(0, 500),
      skills: job.skills,
    }));

    const prompt = `
Tu es un chasseur de têtes expert pour une plateforme de freelance.
Analyse le profil du candidat suivant :
${JSON.stringify(simplifiedProfile)}

Maintenant, voici une liste de missions disponibles :
${JSON.stringify(simplifiedJobs)}

Ta tâche est de sélectionner les 3 missions les plus pertinentes pour ce candidat.
Pour chaque mission sélectionnée, fournis une brève explication (une seule phrase) sur la raison de la correspondance.

IMPORTANT : Retourne UNIQUEMENT un objet JSON valide avec une clé "recommendations" contenant un tableau.
Format EXACT attendu :
{
  "recommendations": [
    { "jobId": 42, "reason": "Correspond parfaitement à vos compétences en React." },
    { "jobId": 15, "reason": "Votre expérience en design UI/UX serait un atout majeur." },
    { "jobId": 8, "reason": "Projet e-commerce aligné avec votre profil." }
  ]
}

NE PAS retourner plusieurs objets séparés. UN SEUL objet JSON avec un tableau dedans.
    `;

    completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const rawContentString = completion.choices[0].message.content.trim();

    let parsedContent;

    try {
      // Tentative de parsing normal
      parsedContent = JSON.parse(rawContentString);
    } catch (parseError) {
      // ✅ CAS SPÉCIAL : Plusieurs objets JSON séparés (comme dans votre erreur)
      logger.warn(
        "Parsing JSON échoué, tentative de récupération des objets multiples"
      );

      // On essaie d'extraire tous les objets JSON individuels
      const jsonObjects = [];
      const lines = rawContentString.split("\n");
      let currentObject = "";
      let braceCount = 0;

      for (const line of lines) {
        currentObject += line;

        // Compter les accolades pour détecter quand un objet est complet
        for (const char of line) {
          if (char === "{") braceCount++;
          if (char === "}") braceCount--;
        }

        // Si on a un objet complet
        if (braceCount === 0 && currentObject.trim()) {
          try {
            const obj = JSON.parse(currentObject);
            jsonObjects.push(obj);
            currentObject = "";
          } catch (e) {
            // Objet incomplet, on continue
          }
        }
      }

      // Si on a réussi à extraire des objets, on les retourne comme un tableau
      if (jsonObjects.length > 0) {
        parsedContent = { recommendations: jsonObjects };
      } else {
        throw new Error("Impossible de parser la réponse JSON");
      }
    }

    // Maintenant on gère les différents formats possibles
    let result;

    // CAS 1 : C'est directement un tableau
    if (Array.isArray(parsedContent)) {
      result = parsedContent;
    }
    // CAS 2 : C'est un objet avec une clé qui contient le tableau
    else if (typeof parsedContent === "object" && parsedContent !== null) {
      // On cherche la première clé qui contient un tableau
      const possibleKeys = [
        "recommendations",
        "missions",
        "matches",
        "selectedJobs",
        "jobs",
      ];

      for (const key of possibleKeys) {
        if (Array.isArray(parsedContent[key])) {
          result = parsedContent[key];
          break;
        }
      }

      // Si aucune clé connue, on prend la valeur de la première clé
      if (!result) {
        const firstKey = Object.keys(parsedContent)[0];
        result = Array.isArray(parsedContent[firstKey])
          ? parsedContent[firstKey]
          : [];
      }
    }
    // CAS 3 : Format inattendu
    else {
      logger.warn("Format de réponse inattendu de l'IA:", parsedContent);
      result = [];
    }

    // Validation finale : s'assurer que chaque élément a bien jobId et reason
    result = result.filter((item) => item.jobId && item.reason);

    if (result.length === 0) {
      logger.warn(
        "Aucune recommandation valide trouvée dans la réponse de l'IA"
      );
    }

    return result;
  } catch (error) {
    logger.error("Erreur API DeepSeek (matching) ou parsing JSON:", {
      message: error.message,
      rawResponse: completion?.choices?.[0]?.message?.content,
      stack: error.stack,
    });
    throw new Error("Impossible de générer les suggestions de missions.");
  }
};

module.exports = { findMatchingJobs };
