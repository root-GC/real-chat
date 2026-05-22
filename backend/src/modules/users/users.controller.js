const usersService = require('./users.service');

async function getProfile(req, res, next) {
  try {
    // req.user vem do middleware de autenticação (JWT)
    const user = await usersService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await usersService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, listUsers, getUser };