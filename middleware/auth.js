// Middleware do autoryzacji JWT i ról użytkowników
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Sprawdza JWT w nagłówku Authorization: Bearer <token>
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return next();
  try {
    const token = auth.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    req.user = null;
  }
  next();
}

// Wymaga zalogowania
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Wymaga określonej roli (np. 'admin', 'owner')
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.role || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireAuth, requireRole };