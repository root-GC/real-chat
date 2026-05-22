const repo = require('./auth.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function register({ email, username, password }) {
  const exists = await repo.findByEmail(email);
  if (exists) throw new Error('Email já registado');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await repo.createUser({
    email,
    username,
    password: hashedPassword
  });

  console.log('USER DO LOGIN:', user);
  console.log(jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' }));

//   const token = jwt.sign(
//     { id: user.id, email: user.email },
//     process.env.JWT_SECRET,
//     { expiresIn: '7d' }
//   );

const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    username: user.username, // ✅ adicionar isto
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

  return { user, token };
}

async function login({ email, password }) {
  const user = await repo.findByEmail(email);
  if (!user) throw new Error('Credenciais inválidas');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Credenciais inválidas');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    },
    token
  };
}

module.exports = {
  register,
  login
};