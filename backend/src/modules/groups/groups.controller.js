const service = require('./groups.service');

async function getMyGroups(req, res, next) {
  try {
    const groups = await service.getGroupsForUser(req.user.id);
    res.json(groups);
  } catch (err) { next(err); }
}

async function createGroup(req, res, next) {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const group = await service.createGroup(name.trim(), req.user.id, memberIds);
    res.status(201).json(group);
  } catch (err) { next(err); }
}

async function addMember(req, res, next) {
  try {
    await service.addMember(Number(req.params.id), Number(req.body.userId));
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function getMembers(req, res, next) {
  try {
    const members = await service.getMembers(Number(req.params.id));
    res.json(members);
  } catch (err) { next(err); }
}

module.exports = { getMyGroups, createGroup, addMember, getMembers };