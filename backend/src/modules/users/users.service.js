const usersRepo = require('./users.repository');

async function getUserById(userId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new Error('Utilizador não encontrado');
  return user;
}

async function getAllUsers() {
  return usersRepo.findAll();
}

async function getUserByUsername(username) {
  const user = await usersRepo.findByUsername(username);
  if (!user) throw new Error('Utilizador não encontrado');
  return user;
}

module.exports = { getUserById, getAllUsers, getUserByUsername };