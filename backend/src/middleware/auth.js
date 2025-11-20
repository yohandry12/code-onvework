const jwt = require('jsonwebtoken');
const { User } = require('../models'); // On importe le modèle User de Sequelize
const { logger } = require('../utils/logger');

// Générer un token JWT (change le payload de 'userId' à 'id' pour la clarté)
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Utiliser 'id' est la convention avec Sequelize
    process.env.JWT_SECRET || 'votre-cle-secrete-jwt-tres-longue-et-securisee',
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d',
      issuer: 'onvework-api'
    }
  );
};

// Middleware pour vérifier le token JWT (authentification)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-jwt-tres-longue-et-securisee');
    
    // --- CORRECTION : Remplacer findById par findByPk ---
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Token invalide - utilisateur introuvable' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Compte désactivé' });
    }

    req.user = user; // `req.user` est maintenant une instance complète de Sequelize
    next();

  } catch (error) {
    logger.error('Erreur authentification JWT:', error);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, error: 'Token invalide' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, error: 'Token expiré' });
    return res.status(500).json({ success: false, error: 'Erreur d\'authentification' });
  }
};

// Middleware pour vérifier les rôles (autorisation)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé - privilèges insuffisants' });
    }
    next();
  };
};

// Middleware pour vérifier la propriété de la ressource
const requireOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId || req.params.id;
  
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentification requise' });
  }

  // L'admin peut tout faire
  if (req.user.role === 'admin') {
    return next();
  }
  
  // --- CORRECTION : Comparer les 'id' (nombres) au lieu de '_id' (objets) ---
  if (req.user.id.toString() === resourceUserId.toString()) {
    return next();
  }

  return res.status(403).json({ success: false, error: 'Accès refusé - vous ne pouvez modifier que vos propres données' });
};

// Middleware d'authentification optionnelle
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      req.user = null; // Important: définir req.user à null
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-cle-secrete-jwt-tres-longue-et-securisee');
    
    // --- CORRECTION : Utiliser findByPk ---
    const user = await User.findByPk(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    // Si le token est invalide/expiré, on ne bloque pas la requête, on continue sans utilisateur
    req.user = null;
    next();
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth
};