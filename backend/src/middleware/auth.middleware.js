const { verify } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token obrigatório' });

  const token = header.split(' ')[1];
  try {
    req.user = verify(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};