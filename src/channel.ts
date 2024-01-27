import {
  getData,
  setData,
} from './dataStore';
import {
  isChannelIdValid,
  isPrivateChannel,
  isGlobalOwner,
  getUidFromToken,
  hasChannelOwnerPermissions,
  isUserIdValid,
  getHandleFromUid,
  isChannelOwner,
} from './other';
import {
  ChannelMessages,
  ChannelDetails,
  BAD_REQUEST,
  FORBIDDEN,
} from './interface';
import HTTPError from 'http-errors';
import {
  sendAddNotif,
} from './notifications';
import { botSendV1 } from './bot';
import { updateNumChannelsJoined } from './stats';

/**
   * Allows a user to join a channel if the user is authorized to do so.
   *
   * @param {string} token - The token of the authenticated user.
   * @param {number} channelId - The ID of the channel to join.
   * ...
   *
   * @returns {{}} - If successful, return empty object
*/
export function channelJoinV3(token: string, channelId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid channelId');
  }
  if (channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(BAD_REQUEST, 'User is already a member of the channel');
  }
  if (isPrivateChannel(channelId) && isGlobalOwner(authUserId) === undefined) {
    throw HTTPError(FORBIDDEN, 'User is not a global owner and the channel is private');
  }

  const user = data.users.find(user => user.authUserId === authUserId);
  const userHandle = user.handleStr;
  channel.allMembers.push(user);
  updateNumChannelsJoined(authUserId, true);

  botSendV1(channelId, -1, `Hello @${userHandle}! 👋 Welcome to ${channel.name}!`);

  setData(data);
  return {};
}

/**
   * Invites a user to a channel
   *
   * @param {string} token - The token of the authenticated user.
   * @param {number} channelId - The ID of the channel to invite the user to.
   * @param {number} uId - The ID of the user to invite to the channel.
   * ...
   *
   * @returns {{}} - If successful, return empty object
*/
export function channelInviteV3(token: string, channelId: number, uId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const channel = data.channels.find(channel => channel.channelId === channelId);
  const invitedUser = data.users.find(user => user.uId === uId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid channel ID');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'Requester is not a member of the channel');
  }
  if (invitedUser === undefined) {
    throw HTTPError(BAD_REQUEST, 'Invalid user ID');
  }
  if (channel.allMembers.some(member => member.uId === uId)) {
    throw HTTPError(BAD_REQUEST, 'Invited user is already a member of the channel');
  }

  channel.allMembers.push(invitedUser);
  updateNumChannelsJoined(invitedUser.uId, true);

  const inviterHandle = data.users.find(user => user.uId === authUserId).handleStr;
  sendAddNotif(channelId, -1, inviterHandle, uId);
  const userHandle = getHandleFromUid(uId);

  botSendV1(channelId, -1, `Hello @${userHandle}! 👋 Welcome to ${channel.name}!`);

  setData(data);
  return {};
}

/**
  * Returns up to 50 messages between index "start" and "start + 50" for a given channel
  * with ID "channelId" that the authorized user is a member of.
  *
  * Returns a new index "end". If there are more messages to return after
  * this function call, "end" equals "start + 50".
  *
  * If the eturned the least recent messages in the channel, "end" equals -1
  * to indicate that there are no more messages to load after this return.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} channelId - id of a channel
  * @param {number} start - the starting index for messages to be returned
  * ...
  *
  * @returns {{messages, start, end}} - if successful, return an object containing { messages, start, end }
*/
export function channelMessagesV3(token: string, channelId: number, start: number): ChannelMessages {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid channelId');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'Requester is not a member of the channel');
  }

  const messagelog = channel.messages;
  if (start > messagelog.length) {
    throw HTTPError(BAD_REQUEST, 'invalid start index');
  }

  const pageMax = 50;
  const endIndex = Math.min(start + pageMax, channel.messages.length);
  const channelMsgs = channel.messages.slice(start, endIndex);

  // for each message in the channelMsgs array, check if user is in reacts
  // if so, set isThisUserReacted to be true/false
  for (const message of channelMsgs) {
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
  if (endIndex === channel.messages.length) {
    end = -1;
  } else {
    end = endIndex;
  }

  return {
    messages: channelMsgs.reverse(),
    start: start,
    end: end,
  };
}

/**
   * Retrieves basic details of a channel specified by channelId if the authorised user
   * is a member of the channel.
   *
   * @param {string} token - The token of the authenticated user.
   * @param {number} channelId - The ID of the channel to get the details of.
   * ...
   *
   * @returns {{name, isPublic, ownerMembers, allMembers}} - If successful, return an object containing
   * { name, isPublic, ownerMembers, allMembers }
*/
export function channelDetailsV3(token: string, channelId: number): ChannelDetails {
  const data = getData();
  const authUserId = getUidFromToken(token);
  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  const channel = data.channels.find(channels => channels.channelId === channelId);

  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'invalid channel');
  }
  if (!channel.allMembers.find(user => user.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'Requester is not a member of the channel');
  }

  const channelOwner = channel.ownerMembers.map(owner => ({
    uId: owner.uId,
    email: data.users[owner.uId].email,
    nameFirst: data.users[owner.uId].nameFirst,
    nameLast: data.users[owner.uId].nameLast,
    handleStr: data.users[owner.uId].handleStr,
    profileImgUrl: data.users[owner.uId].profileImgUrl
  }));

  const channelMembers = channel.allMembers.map(member => ({
    uId: member.uId,
    email: data.users[member.uId].email,
    nameFirst: data.users[member.uId].nameFirst,
    nameLast: data.users[member.uId].nameLast,
    handleStr: data.users[member.uId].handleStr,
    profileImgUrl: data.users[member.uId].profileImgUrl
  }));

  return {
    name: channel.name,
    isPublic: channel.isPublic,
    ownerMembers: channelOwner,
    allMembers: channelMembers,
  };
}

/**
  * Make user with user id uId an owner of the channel.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} channelId - The id of the channel to which the user will be added as an owner.
  * @param {number} uId - The id of the user to add as an owner.
  * ...
  *
  * @returns {{}} - If successful, returns an empty object
*/
export function channelAddOwnerV2(token: string, channelId: number, uId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const user = data.users.find(user => user.uId === uId);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  const authUserHandle = getHandleFromUid(authUserId);
  const uIdHandle = getHandleFromUid(uId);
  console.log(`requester: ${authUserHandle}`);
  console.log(`uId: ${uIdHandle}`);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid channelId');
  }
  if (!isUserIdValid(uId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid uId');
  }
  if (!channel.allMembers.find(user => user.uId === authUserId)) {
    throw HTTPError(BAD_REQUEST, 'Requester is not a member of the channel');
  }
  if (channel.ownerMembers.find(user => user.uId === uId)) {
    throw HTTPError(BAD_REQUEST, 'User is already an owner of the channel');
  }
  if (hasChannelOwnerPermissions(authUserId, channelId) === undefined) {
    throw HTTPError(FORBIDDEN, 'Requester does not have owner permissions');
  }

  // add owner to channel
  channel.ownerMembers.push(user);

  setData(data);
  return {};
}

/**
  * Given a channel with ID channelId that the authorised user is a member of,
  * remove them as a member of the channel.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} channelId - The id of the channel to leave.
  * ...
  *
  * @returns {{}} - If successful, returns an empty object
*/
export function channelLeaveV2(token: string, channelId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid channelId');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'User is not a member of the channel');
  }

  if (channel.standUpActive === true && channel.standUpMessage.uId === authUserId) {
    throw HTTPError(BAD_REQUEST, 'User is the starter of an active standup in the channel');
  }

  // Remove the authenticated user from the 'allMembers' part of the channel.
  channel.allMembers = channel.allMembers.filter(member => member.uId !== authUserId);

  // If the authenticated user is an owner, remove them from the 'ownerMembers' part of the channel.
  const isOwner = channel.ownerMembers.some(member => member.uId === authUserId);
  if (isOwner) {
    channel.ownerMembers = channel.ownerMembers.filter(member => member.uId !== authUserId);
  }

  updateNumChannelsJoined(authUserId, false);

  setData(data);
  return {};
}

/**
  * Remove user with user id uId as an owner of the channel.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {number} channelId - The id of the channel to which the user will be removed as an owner
  * @param {number} uId - The id of the user to remove as an owner.
  * ...
  *
  * @returns {{}} - If successful, returns an empty object
*/
export function channelRemoveOwnerV2(token: string, channelId: number, uId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const user = data.users.find(user => user.uId === uId);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid channelId');
  }
  if (user === undefined) {
    throw HTTPError(BAD_REQUEST, 'Invalid user ID');
  }
  if (hasChannelOwnerPermissions(authUserId, channelId) === undefined) {
    throw HTTPError(FORBIDDEN, 'Requester does not have owner permissions');
  }
  if (!isChannelOwner(uId, channelId)) {
    throw HTTPError(BAD_REQUEST, 'User is not an owner of the channel');
  }
  if (channel.ownerMembers.length === 1) {
    throw HTTPError(BAD_REQUEST, 'User is the only owner of the channel');
  }

  // remove owner from channel
  channel.ownerMembers = channel.ownerMembers.filter(member => member.uId !== uId);

  setData(data);
  return {};
}
