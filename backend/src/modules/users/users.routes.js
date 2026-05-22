const router = require('express').Router();
const auth = require('../../middleware/auth.middleware');
const controller = require('./users.controller');

// Todas as rotas exigem autenticação
router.use(auth);

router.get('/', controller.listUsers);           // GET /api/users
router.get('/me', controller.getProfile);        // GET /api/users/me
router.get('/:id', controller.getUser);          // GET /api/users/:id

module.exports = router;