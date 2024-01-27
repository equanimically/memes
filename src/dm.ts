import {
  getData,
  setData,
} from './dataStore';
import {
  DMDetails,
  DMId,
  DMList,
  DMMessages,
  BAD_REQUEST,
  FORBIDDEN,
  K_24,
} from './interface';
import {
  getUidFromToken,
  isDmIdValid,
  isUserIdValid,
} from './other';
import HTTPError from 'http-errors';
import {
  sendAddNotif,
} from './notifications';
import { updateNumDms, updateNumDmsJoined, updateNumMessages } from './stats';

/**
 * Given a DM ID and a user ID, checks whether the user is a member of the DM or not
 * based on the provided dmId and uId.
 *
 * @param {number} uId - an integer to identify a user
 * @param {number} dmId - an integer to identify a direct message
 *
 * @returns {boolean} - Returns true if the user is a member of the DM based on the
 * provided uId and dmId, false otherwise.
*/
function isUserDMmember(uId: number, dmId: number) {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);
  if (dm !== undefined) {
    if (dm.uIds.indexOf(uId) !== -1) {
      return true;
    } else {
      return undefined;
    }
  }
}

/**
 * Given a DM ID and a user ID, checks whether the user is the owner of the DM or not
 * based on the provided dmId and uId.
 *
 * @param {number} uId - an integer to identify a user
 * @param {number} dmId - an integer to identify a direct message
 *
 * @returns {boolean} - Returns true if the user is the owner of the DM based on the
 * provided uId and dmId, false otherwise.
*/
function isUserDMOwner(uId: number, dmId: number) {
  const data = getData();
  const checkDM = data.dms.find(dm => dm.ownerId === uId && dm.dmId === dmId);
  setData(data);
  return !!checkDM;
}

/**
   * returns up to 50 messages from target dm
   *
   * @param {string} token - represents the current authenticated user.
   * @param {number} dmId - The ID of the target dm
   * @param {number} start - determines from which message to return
   * ...
   *
   * @returns {DMMessages} - If successful, return an object with
   *    array containing 50 most recent messages starting from message referenced by start
   *    start
   *    end, a number referencing the last message returned, or -1 if less than 50 messages returned in array above
*/
export function dmMessagesV2(token: string, dmId: number, start: number): DMMessages {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'invalid token');
  }
  if (!isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'an invalid dmId');
  }
  if (isUserDMmember(authUserId, dmId) === undefined) {
    throw HTTPError(FORBIDDEN, 'user is not the DM member');
  }
  const targetDm = data.dms.find(dm => dm.dmId === dmId);
  if (start > targetDm.messages.length || start < 0) {
    throw HTTPError(BAD_REQUEST, 'start is out of bounds');
  }

  // added code to ignore unsent messages
  const now = Math.floor((new Date()).getTime() / 1000);
  const unsentCount = targetDm.messages.filter(message => message.timeSent > now).length;
  const pageMax = 50;
  const endIndex = Math.min(start + pageMax, targetDm.messages.length) + unsentCount;
  let dMessages = targetDm.messages.slice(start, endIndex);
  dMessages = dMessages.filter(message => message.timeSent <= now);

  // for each message in the channelMsgs array, check if user is in reacts
  // if so, set isThisUserReacted to be true/false
  for (const message of dMessages) {
    const react = message.reacts.find(react => react.reactId === 1);
    if (react) {
      if (react.uIds.includes(authUserId)) {
        react.isThisUserReacted = true;
      } else {
        react.isThisUserReacted = false;
      }
    }
  }

  let end;
  if (endIndex >= targetDm.messages.length) {
    end = -1;
  } else {
    end = start + 50;
  }

  return {
    messages: dMessages.reverse(),
    start: start,
    end: end,
  };
}

/**
  * Creates a new Direct Message with the given name and adds it to the list of DM.
  * The creator is the owner of the DM.
  * name is automatically generated based on the users that are in this DM
  * and alphabetically sorted.
  * An empty uIds list means the creator is the only member(DM).
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} uIds - an integer to indentify a user
  * ...
  * @returns {{dmId}} - If successful, returns an object containing the ID of the new DM
*/
export function dmCreateV2(token: string, uIds: number[]): DMId {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  if (uIds.some(uId => data.users.findIndex(user => user.uId === uId) === -1)) {
    throw HTTPError(BAD_REQUEST, 'a uId in uIds does not refer to a valid user');
  }

  if (uIds.length !== new Set(uIds).size) {
    throw HTTPError(BAD_REQUEST, 'there are duplicate uIds in uIds');
  }

  const allMembersId = [authUserId, ...uIds];
  const name = allMembersId
    .map(uId => data.users.find(user => user.uId === uId)?.handleStr)
    .sort()
    .join(', ');
  const maxDmId = Math.max(...data.dms.map(dm => dm.dmId), 0);
  const dmId = maxDmId + 1;

  data.dms.push({
    dmId,
    name,
    ownerId: authUserId,
    uIds: [authUserId, ...uIds],
    messages: [],
    bots: [K_24],
    hangmanActive: false,
    hangmanGameId: -1,
  });

  const inviterHandle = data.users.find(user => user.uId === authUserId).handleStr;
  for (const uId of uIds) {
    if (uId !== undefined) {
      sendAddNotif(-1, dmId, inviterHandle, uId);
    }
  }

  // update stats
  const dm = data.dms.find(dm => dm.dmId === dmId);
  for (const uId of dm.uIds) {
    if (uId !== undefined) {
      updateNumDmsJoined(uId, true);
    }
  }

  updateNumDms();

  setData(data);
  return { dmId };
}

/**
  * Returns the list of DMs that the user is a member of.
  *
  * @param {string} token - The token of the authenticated user.
  * ...
  *
  * @returns {{dms}} - If successful, returns a list of DMs that user is member of
*/
export function dmListV2(token: string): DMList {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  const dms = data.dms.filter(dm => dm.uIds.includes(authUserId)).map(({ dmId, name }) => ({ dmId, name }));

  setData(data);
  return { dms };
}

/**
  * Remove an existing DM, so all members are no longer in the DM.
  * This can only be done by the original creator of the DM.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} dmId - an integer to indentify a direct message
  *
  * @returns {{}} - If successful, returns empty object
*/

export function dmRemoveV2(token: string, dmId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'an invalid dmId');
  }
  if (!isUserDMOwner(authUserId, dmId)) {
    throw HTTPError(FORBIDDEN, 'user is not the DM owner');
  }

  // update stats
  const dm = data.dms.find(dm => dm.dmId === dmId);
  for (const uId of dm.uIds) {
    if (uId !== undefined) {
      updateNumDmsJoined(uId, false);
    }
  }

  // decrease numMessagesExist
  for (let i = 0; i < dm.messages.length; i++) {
    updateNumMessages(false);
  }

  data.dms = data.dms.filter((dm) => dm.dmId !== dmId); // remove in the dataStore

  // update numDmsExist
  updateNumDms();

  setData(data);
  return {};
}

/**
  * Given a DM with ID dmId that the authorised user is a member of, provide basic details about the DM.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} dmId - an integer to indentify a direct message
  *
  * @returns {{name, members}} - If successful, returns the name of the direct message,
  * and the members who are part of it
*/
export function dmDetailsV2(token: string, dmId: number): DMDetails {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'an invalid dmId');
  }
  if (!isUserDMmember(authUserId, dmId)) {
    throw HTTPError(FORBIDDEN, 'user is not the DM member');
  }

  const dm = getData().dms.find(dm => dm.dmId === dmId);
  const dmMembers = dm.uIds.map(member => ({
    uId: member,
    email: data.users[member].email,
    nameFirst: data.users[member].nameFirst,
    nameLast: data.users[member].nameLast,
    handleStr: data.users[member].handleStr,
    profileImgUrl: data.users[member].profileImgUrl
  }));

  setData(data);
  return {
    name: dm.name,
    members: dmMembers,
  };
}

/**
  * Given a DM ID, the user is removed as a member of this DM.
  * The creator is allowed to leave and the DM will still exist if this happens.
  * This does not update the name of the DM.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} dmId - an integer to indentify a direct message
  *
  * @returns {{}} - If successful, returns nothing {empty}
*/
export function dmLeaveV2(token: string, dmId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'an invalid dmId');
  }
  if (!isUserDMmember(authUserId, dmId)) {
    throw HTTPError(FORBIDDEN, 'user is not the DM member');
  }

  const dm = data.dms.find(dm => dm.dmId === dmId);

  if (dm.ownerId === authUserId) {
    dm.ownerId = -1;
  }
  dm.uIds = dm.uIds.filter(uId => uId !== authUserId);

  updateNumDmsJoined(authUserId, false);

  setData(data);
  return {};
}
