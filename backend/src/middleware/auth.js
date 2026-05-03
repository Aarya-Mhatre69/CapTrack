const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.split(' ')[1];
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireTeam(req, res, next) {
  if (req.auth?.type !== 'team') return res.status(403).json({ error: 'Forbidden: team access only' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (req.auth?.type !== 'user' || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireTeam, requireRole };
