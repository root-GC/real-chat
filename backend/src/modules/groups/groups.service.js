const groupsRepo = require('./groups.repository');

async function getGroupsForUser(userId) {
  await groupsRepo.addMember(1, userId); // ensure global group membership
  return groupsRepo.findAllForUser(userId);
}

async function createGroup(name, createdBy, memberIds = []) {
  const group = await groupsRepo.create(name, createdBy);
  await groupsRepo.addMember(group.id, createdBy);
  for (const uid of memberIds) {
    await groupsRepo.addMember(group.id, Number(uid));
  }
  return group;
}

async function addMember(groupId, userId) {
  return groupsRepo.addMember(groupId, userId);
}

async function getMembers(groupId) {
  return groupsRepo.getMembers(groupId);
}

async function getMemberIds(groupId) {
  return groupsRepo.getMemberIds(groupId);
}

async function isMember(groupId, userId) {
  return groupsRepo.isMember(groupId, userId);
}

/**
 * Deletes a group.
 * Returns { ok: true } on success or throws with a human-readable message.
 * Only the creator can delete; global group (id=1) is protected.
 */
async function deleteGroup(groupId, requestingUserId) {
  const group = await groupsRepo.findById(groupId);

  if (!group) throw new Error('Grupo não encontrado.');
  if (group.is_global) throw new Error('O grupo geral não pode ser apagado.');
  if (group.created_by !== requestingUserId) {
    throw new Error('Só o criador do grupo o pode apagar.');
  }

  // collect member ids BEFORE deleting so we can notify them
  const memberIds = await groupsRepo.getMemberIds(groupId);

  await groupsRepo.deleteGroup(groupId);

  return { group, memberIds };
}

module.exports = {
  getGroupsForUser,
  createGroup,
  addMember,
  getMembers,
  getMemberIds,
  isMember,
  deleteGroup,
};