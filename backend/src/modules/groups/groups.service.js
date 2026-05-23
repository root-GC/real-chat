const groupsRepo = require('./groups.repository');

/**
 * Returns all groups for userId, auto-enrolling them in the global group (id=1)
 * if not already a member.
 */
async function getGroupsForUser(userId) {
  await groupsRepo.addMember(1, userId); // ensure global group membership
  return groupsRepo.findAllForUser(userId);
}

/**
 * Creates a new group, adds creator + optional extra members.
 */
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

async function isMember(groupId, userId) {
  return groupsRepo.isMember(groupId, userId);
}

module.exports = { getGroupsForUser, createGroup, addMember, getMembers, isMember };