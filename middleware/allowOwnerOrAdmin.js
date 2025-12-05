// Middleware: allowOwnerOrAdmin.js
/**
 * Tworzy middleware, które sprawdza czy użytkownik jest właścicielem zasobu lub administratorem.
 * @param {function} getOwnerUsername - funkcja async, która zwraca nazwę właściciela zasobu na podstawie req
 * @returns {function} middleware
 */
function allowOwnerOrAdmin(getOwnerUsername) {
  return async function (req, res, next) {
    try {
      const owner = await getOwnerUsername(req);
      if (!owner) return res.status(404).json({ error: 'Resource owner not found' });
      if ((req.user && req.user.role >= 2) || (req.user && req.user.username === owner)) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      return res.status(500).json({ error: 'Middleware error', details: String(e) });
    }
  };
}

module.exports = allowOwnerOrAdmin;
