console.log("SERVICE FILE LOADED");

const service = require('./auth.service');
console.log("SERVICE:", service);
async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;
    if (!email || !password) throw new Error('Email e password são obrigatórios');

    const result = await service.register({ email, username, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error('Email e password são obrigatórios');

    const result = await service.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};