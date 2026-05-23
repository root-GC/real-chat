// Register in app.js:
//   app.use('/api/groups', require('./src/modules/groups/groups.routes'));

const router     = require('express').Router();
const auth       = require('../../middleware/auth.middleware');
const controller = require('./groups.controller');

router.get('/mine',          auth, controller.getMyGroups);
router.post('/',             auth, controller.createGroup);
router.post('/:id/members',  auth, controller.addMember);
router.get('/:id/members',   auth, controller.getMembers);

module.exports = router;