const service = require('./messages.service');

async function sendPrivate(req, res, next) {
  try {
    const { toId, content } = req.body;
    const fromId = req.user.id; // vem do middleware JWT
    const result = await service.sendPrivate({ fromId, toId, content });
    res.json(result.msg);
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;
    const messages = await service.getConversation(myId, otherId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendPrivate, getConversation };