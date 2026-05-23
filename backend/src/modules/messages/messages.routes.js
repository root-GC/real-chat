// messages.routes.js
const router = require('express').Router();
const auth = require('../../middleware/auth.middleware');
const controller = require('./messages.controller');

router.post('/private', auth, controller.sendPrivate);
router.get('/conversation/:userId', auth, controller.getConversation);

module.exports = router;