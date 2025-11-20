const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getAIChatResponse } = require("../services/aiService");
const { logger } = require("../utils/logger");

const router = express.Router();

// On s'assure que seul un utilisateur connecté peut utiliser l'IA
router.use(authenticateToken);

// On crée la route : POST /api/ai/chat
router.post("/chat", async (req, res) => {
  // 1. On récupère les données envoyées par le frontend
  const { messages, jobContext } = req.body;

  // Petite validation pour s'assurer qu'on reçoit bien des messages
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "L'historique des messages est requis." });
  }

  try {
    // 2. On passe les données à notre service IA
    const aiResponse = await getAIChatResponse(messages, jobContext);

    // 3. On renvoie la réponse de l'IA au frontend
    res.json({ success: true, reply: aiResponse });
  } catch (error) {
    logger.error("Erreur dans la route /ai/chat:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
