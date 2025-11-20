const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log l'erreur
  logger.error('Erreur API:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: `Erreur de validation: ${message}`,
      statusCode: 400
    };
  }

  // Erreur de cast Mongoose (ID invalide)
  if (err.name === 'CastError') {
    error = {
      message: 'Identifiant invalide',
      statusCode: 400
    };
  }

  // Erreur de duplication MongoDB (email existant, etc.)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      message: `${field} '${value}' existe déjà`,
      statusCode: 400
    };
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Token invalide',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expiré',
      statusCode: 401
    };
  }

  // Erreur de taille de fichier
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'Fichier trop volumineux (max 5MB)',
      statusCode: 400
    };
  }

  // Réponse d'erreur
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
