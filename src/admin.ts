import {
  getData,
  setData,
} from './dataStore';
import {
  FORBIDDEN,
  BAD_REQUEST,
  OWNER,
  MEMBER,
} from './interface';
import {
  isUserIdValid,
  getUidFromToken,
  isGlobalOwner,
} from './other';
import HTTPError from 'http-errors';

/**
 * Given a user by their uID, sets their permissions to new permissions described by permissionId.
 *
 * @param {string} token - the token of the authenticated user
 * @param {number} uId - the uId of the user whose permissions will be changed
 * @param {number} permissionId - the permissionId to be assigned to the user
 *
 * @returns {} - empty object if succesful
 *
 */
export function adminUserPermissionChangeV1(token: string, uId: number, permissionId: number): object {
  const data = getData();
  const users = data.users;
  const user = users.find(x => x.authUserId === uId);
  if (!isUserIdValid(uId)) {
    throw HTTPError(BAD_REQUEST, 'invalid user Id');
  }
  if (!isGlobalOwner(getUidFromToken(token))) {
    throw HTTPError(FORBIDDEN, 'authorised user is not a global owner');
  }
  if (users.filter(x => isGlobalOwner(x.uId)).length === 1 && isGlobalOwner(uId) === true) {
    throw HTTPError(BAD_REQUEST, 'cannot demote the only global owner');
  }
  if (permissionId !== OWNER && permissionId !== MEMBER) {
    throw HTTPError(BAD_REQUEST, 'permission level must be 1 or 2');
  }
  if (user.userPermissions === permissionId) {
    throw HTTPError(BAD_REQUEST, 'user already have this permission level');
  }

  // editing perms of user with required uId
  user.userPermissions = permissionId;
  setData(data);
  return {};
}

/**
 * Given a user by their uId, removes them from Memes.
 *
 * @param {string} token - the token of the authenticated user
 * @param {number} uId - the uId of the user who will be removed
 *
 * @returns {{}} - empty object if succesful
 *
 */
export function adminUserRemoveV1(token: string, uId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    console.log('invalid token');
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isUserIdValid(uId)) {
    console.log('invalid uId');
    throw HTTPError(BAD_REQUEST, 'Invalid uId');
  }

  const globalOwners = data.users.filter(user => user.userPermissions === OWNER);
  if (globalOwners.length === 1 && globalOwners[0].uId === uId) {
    throw HTTPError(BAD_REQUEST, 'uId is the only global owner');
  }
  if (!isGlobalOwner(authUserId)) {
    throw HTTPError(FORBIDDEN, 'authorised user is not a global owner');
  }

  removeUser(uId);
  replaceRemovedUserMsg(uId);
  removeTokens(uId);
  updateRemovedUserInfo(uId);

  setData(data);

  return {};
}

/**
 * Helper function which removes a user from all channels and dms
 *
 * @param {number} uId - the uId of the user to remove
 *
 * @returns {void}
 */
function removeUser(uId: number) {
  const data = getData();
  // remove user from all channels
  data.channels.forEach(channel => {
    channel.allMembers = channel.allMembers.filter(member => member.uId !== uId);
    channel.ownerMembers = channel.ownerMembers.filter(member => member.uId !== uId);
  });

  // remove user from all dms
  data.dms.forEach(dm => {
    dm.uIds = dm.uIds.filter(member => member !== uId);
  });
}

/**
 * Helper function which replaces all of a user's messages with
 * 'Removed user'
 *
 * @param {number} uId - the uId of the user whose messages will be removed
 *
 * @returns {void}
 */
function replaceRemovedUserMsg(uId: number) {
  const data = getData();
  // replace all messages with "removed user"
  data.channels.forEach(channel => {
    channel.messages.forEach(message => {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    });
  });

  data.dms.forEach(dm => {
    dm.messages.forEach(message => {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    });
  });
}

/**
 * Helper function which removes all of a user's tokens
 *
 * @param {number} uId - the uId of the user whose tokens will be removed
 *
 * @returns {void}
 */
function removeTokens(uId: number) {
  const data = getData();
  const user = data.users.find(user => user.uId === uId);
  for (const token in user.token) {
    delete user.token[token];
  }
}

/**
 * Helper function which updates a removed user's profile information
 *
 * @param {number} uId - the uId of the user whose profile information will
 * be updated
 *
 * @returns {void}
 */
function updateRemovedUserInfo(uId: number) {
  const data = getData();
  const user = data.users.find(user => user.uId === uId);
  user.nameFirst = 'Removed';
  user.nameLast = 'user';
  user.email = '';
  user.handleStr = '';
  user.isRemoved = true;
}
