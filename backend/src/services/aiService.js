const OpenAI = require("openai");
const { logger } = require("../utils/logger");

// 1. On configure le client pour qu'il pointe vers DeepSeek
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY, // Utilise la clé du fichier .env
  baseURL: "https://api.deepseek.com", // Pointeur vers les serveurs de DeepSeek
});

/**
 * Interroge l'IA de DeepSeek avec un historique de conversation et un contexte.
 * @param {Array} messages - L'historique des messages [{ role: 'user', content: '...' }, ...]
 * @param {object} jobContext - L'état actuel du formulaire de création de mission.
 * @returns {Promise<string>} La réponse textuelle de l'IA.
 */
const getAIChatResponse = async (messages, jobContext) => {
  try {
    // 2. On prépare le "prompt système" qui donne son rôle et ses instructions à l'IA
    const systemPrompt = `
            Tu es "Onvework Assistant", un expert en recrutement sympathique et proactif pour une plateforme de freelance.
            Ton but est d'aider un client à créer la meilleure offre de mission possible.
            - Réponds de manière concise et utile en français.
            - Tu as accès au contexte actuel du formulaire que le client remplit : ${JSON.stringify(
              jobContext
            )}. Utilise ces informations pour donner des réponses plus pertinentes.
            - Si on te demande de générer une description ou des compétences, fournis-les dans un format clair avec des listes à puces.
            - Ton ton est celui d'un coach, pas d'un robot.
        `;

    // 3. On combine le prompt système avec l'historique de la conversation
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // 4. On appelle l'API DeepSeek
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat", // Le nom du modèle de DeepSeek
      messages: apiMessages,
    });

    // 5. On retourne la réponse de l'IA
    return completion.choices[0].message.content;
  } catch (error) {
    logger.error("Erreur API DeepSeek (chat):", error);
    throw new Error("L'assistant IA est actuellement indisponible.");
  }
};

module.exports = { getAIChatResponse };
