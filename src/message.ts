import {
  getData,
  setData,
} from './dataStore';
import {
  getUidFromToken,
  genMessageId,
  hasChannelOwnerPermissions,
  messageInChannel,
  messageInDm,
  hasDmOwnerPermissions,
  getTime,
  isUserIdValid,
  isChannelIdValid,
  isDmIdValid,
} from './other';
import {
  Message,
  MessageId,
  SharedMessageId,
  BAD_REQUEST,
  FORBIDDEN,
} from './interface';
import HTTPError from 'http-errors';
import {
  sendReactNotif,
  tagUser,
} from './notifications';
import { botCheckCommandV1 } from './bot';
import { updateNumMessages, updateNumMessagesSent } from './stats';

/**
 * deletes a message with given message Id from channel/DM
 *
 * @param {string} token - The authentication ID of current user.
 * @param {number} messageId - number used to identify messages.
 *
 * @returns {{}} empty object if successful
 * @returns {{ error: 'error' }} object containing error message if:
 *    message id does not refer to valid message in channel/DM user have access to
 *    message was not sent by user
 *    token is invalid
 */
export function messageRemoveV1(token: string, messageId: number): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const inChannelId = messageInChannel(messageId);
  const inDmId = messageInDm(messageId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (inDmId === -1 && inChannelId === -1) {
    throw HTTPError(BAD_REQUEST, 'Invalid messageId');
  }
  if (!hasMessagePermissions(authUserId, messageId, inChannelId, inDmId)) {
    throw HTTPError(FORBIDDEN, 'User does not have permission to remove message');
  }

  removeMessage(messageId, inChannelId, inDmId);

  setData(data);
  return {};
}

/**
 * sends a message to target DM
 *
 * @param {string} token - The authentication ID of current user.
 * @param {number} dmId - number used to identify DMs.
 *
 * @returns {{ messageId }} object containing the id of sent message if successful
 * @returns {{ error: 'error' }} object containing error message if:
 *    invalid dmId
 *    message is too long or short
 *    user does not have access to target dm
 *    token is invalid
 */
export function messageSendDmV1(token: string, dmId: number, message: string): MessageId {
  const data = getData();
  const uId = getUidFromToken(token);

  if (!isUserIdValid(uId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'message too long');
  }
  if (!isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'invalid dmId');
  }
  if (!data.dms.some(dm => dm.uIds.includes(uId))) {
    throw HTTPError(FORBIDDEN, 'user does not have permission to access this DM');
  }

  const mId = genMessageId();
  setData(data);
  const newDm: Message = {
    messageId: mId,
    uId: uId,
    message: message,
    timeSent: Math.floor((new Date()).getTime() / 1000),
    reacts: [],
    isPinned: false,
  };

  const dIndex = data.dms.findIndex(dm => dm.dmId === dmId);
  data.dms[dIndex].messages.push(newDm);
  setData(data);

  botCheckCommandV1(token, -1, dmId, message);

  const senderHandle = data.users.find(user => user.uId === uId).handleStr;
  tagUser(-1, dmId, senderHandle, message);

  updateNumMessagesSent(uId);
  updateNumMessages(true);

  return { messageId: newDm.messageId };
}

/**
 * Sends a message to a channel.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} channelId - The ID of the channel to get the details of.
 * @param {string} message - The message to send.
 * ...
 *
 * @returns {{messageId}} - If successful, return an object containing messageId
 */
export function messageSendV2(token: string, channelId: number, message: string): MessageId {
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
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'length of message is less than 1 or over 1000 characters');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'authorised user is not a member of the channel');
  }

  const newMessage: Message = {
    messageId: genMessageId(),
    uId: authUserId,
    message,
    timeSent: Math.floor((new Date()).getTime() / 1000),
    reacts: [],
    isPinned: false,
  };

  channel.messages.push(newMessage);
  setData(data);

  botCheckCommandV1(token, channelId, -1, message);

  const senderHandle = data.users.find(user => user.uId === authUserId).handleStr;
  tagUser(channelId, -1, senderHandle, message);

  updateNumMessagesSent(authUserId);
  updateNumMessages(true);

  return { messageId: newMessage.messageId };
}

/**
 * Edits a message in a channel or direct message (DM).
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} channelId - The ID of the channel to get the details of.
 * @param {string} message - The message to edit.
 * ...
 *
 * @returns {{}} - If successful, return an empty object.
 */
export function messageEditV2(token: string, messageId: number, message: string): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const inChannelId = messageInChannel(messageId);
  const inDmId = messageInDm(messageId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'Message exceeds 1000 characters');
  }
  if (inChannelId === -1 && inDmId === -1) {
    throw HTTPError(BAD_REQUEST, 'Invalid messageId');
  }
  if (!hasMessagePermissions(authUserId, messageId, inChannelId, inDmId)) {
    throw HTTPError(FORBIDDEN, 'User does not have permission to remove message');
  }

  const senderHandle = data.users.find(user => user.uId === authUserId).handleStr;
  editMessage(messageId, message, inChannelId, inDmId);
  setData(data);

  tagUser(inChannelId, inDmId, senderHandle, message);

  return {};
}

/**
 * Sends a message from the authorised user to the channel specified by channelId
 * automatically at a specified time in the future
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} channelId - The ID of the channel to send the message to.
 * @param {string} message - The message to send
 * @param {number} timeSent - The number of seconds from now when the message will be sent
 * ...
 *
 * @returns {{ messageId }} - If successful, return an object containing the messageId
 */
export function messageSendLaterV1(token: string, channelId: number, message: string, timeSent: number): MessageId {
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
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'length of message is less than 1 or over 1000 characters');
  }
  if (timeSent < getTime()) {
    throw HTTPError(BAD_REQUEST, 'timeSent cannot be a time in the past');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'authorised user is not a member of the channel');
  }

  const delayedMessage: Message = {
    messageId: genMessageId(),
    uId: authUserId,
    message,
    timeSent,
    reacts: [],
    isPinned: false,
  };

  const delay = timeSent - getTime();
  setTimeout(() => {
    if (channel !== undefined) {
      channel.messages.push(delayedMessage);
    }
    updateNumMessages(true);
    updateNumMessagesSent(authUserId);
    setData(data);
  }, delay * 1000);

  setData(data);

  const senderHandle = data.users.find(user => user.uId === authUserId).handleStr;
  tagUser(channelId, -1, senderHandle, message);

  return { messageId: delayedMessage.messageId };
}

/**
 * Shares a message to a channel/DM
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} ogMessageId - The message ID of the original message which will be shared
 * @param {string} message - An optional message in addition to the shared message
 * @param {number} channelId - The channelId of the channel to share the message to, or -1 if message
 * is to be shared to a DM
 * @param {number} dmId - The DMId of the DM to share the message to, or -1 if message
 * is to be shared to a channel
 * ...
 *
 * @returns {{ messageId }} - If successful, return an object containing the messageId
 */
export function messageShareV1(token: string, ogMessageId: number, message: string,
  channelId: number, dmId: number): SharedMessageId {
  const authUserId = getUidFromToken(token);
  const ogChannelId = messageInChannel(ogMessageId);
  const ogDmId = messageInDm(ogMessageId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId) && !isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'invalid channel and DM');
  }
  if (message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'message too long');
  }
  if (channelId !== -1 && dmId !== -1) {
    throw HTTPError(BAD_REQUEST, 'channel and DM cannot both be filled');
  }
  if (ogChannelId === -1 && ogDmId === -1) {
    throw HTTPError(BAD_REQUEST, 'message does not exist');
  }

  if (ogChannelId !== -1 && ogDmId === -1) {
    return shareFromChannel(token, authUserId, ogMessageId, message, ogChannelId, channelId, dmId);
  } else if (ogDmId !== -1 && ogChannelId === -1) {
    return shareFromDm(token, authUserId, ogMessageId, message, ogDmId, channelId, dmId);
  }

  updateNumMessages(true);
  updateNumMessagesSent(authUserId);
}

/**
 * Sends a message from the authorised user to the DM specified by dmId
 * automatically at a specified time in the future
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} channelId - The ID of the DM to send the message to.
 * @param {string} message - The message to send
 * @param {number} timeSent - The number of seconds from now when the message will be sent
 * ...
 *
 * @returns {{ messageId }} - If successful, return an object containing the messageId
 */
export function messageSendLaterDmV1(token: string, dmId: number, message: string, timeSent: number): MessageId {
  let data = getData();
  const uId = getUidFromToken(token);

  const delay = timeSent - getTime();
  if (delay < 0) {
    throw HTTPError(BAD_REQUEST, 'time cannot be in the past');
  }
  if (isUserIdValid(uId) !== true) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'message too long');
  }
  if (!isDmIdValid(dmId)) {
    throw HTTPError(BAD_REQUEST, 'invalid DM');
  }
  if (!data.dms.some(dm => dm.uIds.includes(uId))) {
    throw HTTPError(FORBIDDEN, 'user does not have permission to access this DM');
  }

  const mId = genMessageId();
  const newDm: Message = {
    messageId: mId,
    uId: uId,
    message: message,
    timeSent: timeSent,
    reacts: [],
    isPinned: false,
  };

  const dIndex = data.dms.findIndex(dm => dm.dmId === dmId);

  setTimeout(() => {
    data = getData();
    if (data.dms.findIndex(dm => dm.dmId === dmId) !== -1) {
      data.dms[dIndex].messages.push(newDm);
      updateNumMessagesSent(uId);
      updateNumMessages(true);
      setData(data);
    }
  }, delay * 1000);

  setData(data);

  const senderHandle = data.users.find(user => user.uId === uId).handleStr;
  tagUser(-1, dmId, senderHandle, message);

  return { messageId: newDm.messageId };
}

/**
 * Given a message within a channel or DM the authorised user is part of,
 * adds a "react" to that particular message.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} messageId - The ID of the message to react to
 * @param {number} reactId - The ID of the react
 * ...
 *
 * @returns {{}} - If successful, return an empty object
 */
export function messageReactV1(token: string, messageId: number, reactId: number): Record<never, never> {
  const authUserId = getUidFromToken(token);
  const inChannelId = messageInChannel(messageId);
  const inDmId = messageInDm(messageId);

  // messageId is not a valid message that the authorised user is a part of
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (inChannelId === -1 && inDmId === -1) {
    throw HTTPError(BAD_REQUEST, 'messageId is not a valid message that the authorized user can access');
  }
  if (reactId !== 1) {
    throw HTTPError(BAD_REQUEST, 'reactId is not a valid reactId');
  }

  // if message in channel
  if (inChannelId !== -1) {
    reactInChannel(authUserId, messageId, reactId, inChannelId);
  } else if (inDmId !== -1) {
    reactInDm(authUserId, messageId, reactId, inDmId);
  }

  return {};
}

/**
 * Given a message within a channel or DM the authorised user is part of,
 * removes a "react" to that particular message.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} messageId - The ID of the message to remove the react from
 * @param {number} reactId - The ID of the react
 * ...
 *
 * @returns {{}} - If successful, return an empty object
 */
export function messageUnreactV1(token: string, messageId: number, reactId: number): Record<never, never> {
  const authUserId = getUidFromToken(token);
  const inChannelId = messageInChannel(messageId);
  const inDmId = messageInDm(messageId);

  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (inChannelId === -1 && inDmId === -1) {
    throw HTTPError(BAD_REQUEST, 'messageId is not a valid message that the authorized user can access');
  }
  if (reactId !== 1) {
    throw HTTPError(BAD_REQUEST, 'reactId is not a valid reactId');
  }

  if (inChannelId !== -1) {
    unreactInChannel(authUserId, messageId, reactId, inChannelId);
  } else if (inDmId !== -1) {
    unreactInDm(authUserId, messageId, reactId, inDmId);
  }
  return {};
}

/**
 * Given a message within a channel or DM, marks it as "pinned".
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} messageId - The ID of the message to pin
 * ...
 *
 * @returns {{}} - If successful, return an empty object
 */
export function messagePinV1(token: string, messageId: number): Record<never, never> {
  const authUserId = getUidFromToken(token);
  const inChannelId = messageInChannel(messageId);
  const inDmId = messageInDm(messageId);

  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'invalid token');
  }
  if (inChannelId === -1 && inDmId === -1) {
    throw HTTPError(BAD_REQUEST, 'message does not exist');
  }

  // if message is in channel
  if (inChannelId !== -1) {
    changePinChannelMessage(authUserId, messageId, inChannelId, true);

  // if message is in dm
  } else if (inDmId !== -1) {
    changePinDmMessage(authUserId, messageId, inDmId, true);
  }

  return {};
}

/**
 * Given a message within a channel or DM, removes its mark as "pinned".
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} messageId - The ID of the message to pin
 * ...
 *
 * @returns {{}} - If successful, return an empty object
 */
export function messageUnpinV1(token: string, messageId: number): Record<never, never> {
  const authUserId = getUidFromToken(token);
  const inChannelId = messageInChannel(messageId);
  const inDmId = messageInDm(messageId);

  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'invalid token');
  }
  if (inChannelId === -1 && inDmId === -1) {
    throw HTTPError(BAD_REQUEST, 'message does not exist');
  }

  // if message is in channel
  if (inChannelId !== -1) {
    changePinChannelMessage(authUserId, messageId, inChannelId, false);

  // if message is in dm
  } else if (inDmId !== -1) {
    changePinDmMessage(authUserId, messageId, inDmId, false);
  }

  return {};
}

/**
 * Helper function which checks whether a user has permission to edit/remove a message
 *
 * @param {number} authUserId - the user ID of the authorised user
 * @param {number} messageId - The ID of the message to be removed/edited
 * @param {number} inChannel - the ID of the channel which contains the message to be removed/edited,
 * or, -1 if the message is in a DM
 * @param {number} inDm - the ID of the DM which contains the message to be removed/edited,
 * or, -1 if the message is in a channel
 * ...
 *
 * @returns {void} - returns nothing
 */
function hasMessagePermissions(authUserId: number, messageId: number, inChannel: number, inDm: number): boolean {
  const data = getData();
  if (inChannel !== -1) {
    const channelContainingMessage = data.channels.find(channel => channel.channelId === inChannel);
    const sentByUser = channelContainingMessage.messages.some(m => m.messageId === messageId && m.uId === authUserId);
    return hasChannelOwnerPermissions(authUserId, inChannel) || sentByUser;
  } else if (inDm !== -1) {
    const dmContainingMessage = data.dms.find(dm => dm.dmId === inDm);
    const sentByUser = dmContainingMessage.messages.some(m => m.messageId === messageId && m.uId === authUserId);
    return hasDmOwnerPermissions(authUserId, inDm) || sentByUser;
  }
}

/**
 * Helper function which removes a message.
 *
 * @param {number} messageId - The ID of the message to remove
 * @param {number} inChannel - the ID of the channel which contains the message to be removed,
 * or, -1 if the message is in a DM
 * @param {number} inDm - the ID of the DM which contains the message to be removed,
 * or, -1 if the message is in a channel
 * ...
 *
 * @returns {void} - returns nothing
 */
function removeMessage(messageId: number, inChannel: number, inDm: number): void {
  if (inChannel !== -1) {
    channelMessageRemove(inChannel, messageId);
  } else if (inDm !== -1) {
    dmMessageRemove(inDm, messageId);
  }
  updateNumMessages(false);
}

/**
 * Helper function which removes a message from a channel
 *
 * @param {number} channelId - The ID of the channel which contains the message to be removed.
 * @param {number} messageId - The ID of the message to removed
 * ...
 *
 * @returns {void} - returns nothing
 */
function channelMessageRemove(channelId: number, messageId: number) {
  const data = getData();
  const channelContainingMessage = data.channels.find(channel => channel.channelId === channelId);
  channelContainingMessage.messages = channelContainingMessage.messages
    .filter(message => message.messageId !== messageId);
}

/**
 * Helper function which removes a message from a DM
 *
 * @param {number} dmId - The ID of the DM which contains the message to be removed.
 * @param {number} messageId - The ID of the message to remove
 * ...
 *
 * @returns {void} - returns nothing
 */
function dmMessageRemove(dmId: number, messageId: number) {
  const data = getData();
  const dmContainingMessage = data.dms.find(dm => dm.dmId === dmId);
  dmContainingMessage.messages = dmContainingMessage.messages
    .filter(message => message.messageId !== messageId);
}

/**
 * Helper function which edits a message.
 *
 * @param {number} messageId - The ID of the message to edit
 * @param {string} message - The message to send.
 * @param {number | undefined} inChannel - the ID of the channel which contains the message to be edited,
 * or, undefined if the message is in a DM
 * @param {number | undefined} inDm - the ID of the DM which contains the message to be edited,
 * or, undefined if the message is in a channel
 * ...
 *
 * @returns {void} - returns nothing
 */
function editMessage(messageId: number, message: string, inChannel: number, inDm: number): void {
  if (inChannel !== -1) {
    channelMessageEdit(inChannel, messageId, message);
  } else if (inDm !== -1) {
    dmMessageEdit(inDm, messageId, message);
  }
}

/**
 * Helper function which edits a message in a channel
 *
 * @param {number} channelId - The ID of the channel which contains the message to be edited.
 * @param {number} messageId - The ID of the message to edit
 * @param {string} message - The message to send.
 * ...
 *
 * @returns {void} - returns nothing
 */
function channelMessageEdit(channelId: number, messageId: number, message: string): void {
  const data = getData();
  if (message.length === 0) {
    removeMessage(messageId, channelId, -1);
  } else {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    const messageIndex = channel.messages.findIndex(message => message.messageId === messageId);
    channel.messages[messageIndex].message = message;
  }
}

/**
 * Helper function which edits a message in a DM
 *
 * @param {number} dmId - The ID of the DM which contains the message to be edited.
 * @param {number} messageId - The ID of the message to edit
 * @param {string} message - The message to send.
 * ...
 *
 * @returns {void} - returns nothing
 */
function dmMessageEdit(dmId: number, messageId: number, message: string): void {
  const data = getData();
  if (message.length === 0) {
    removeMessage(messageId, -1, dmId);
  } else {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    const messageIndex = dm.messages.findIndex(message => message.messageId === messageId);
    dm.messages[messageIndex].message = message;
  }
}

/**
 * Shares a message to a channel/DM from a channel
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} authUserId - the user ID of the authenticated user.
 * @param {number} ogMessageId - The message ID of the original message which will be shared
 * @param {string} message - An optional message in addition to the shared message
 * @param {number} ogChannelId - the channelId of the channel to share the message from
 * @param {number} channelId - The channelId of the channel to share the message to, or -1 if message
 * is to be shared to a DM
 * @param {number} dmId - The DMId of the DM to share the message to, or -1 if message
 * is to be shared to a channel
 * ...
 *
 * @returns {{ sharedMessageId }} - If successful, return an object containing the sharedMessageId
 */
function shareFromChannel
(token: string, authUserId: number, ogMessageId: number, message: string, ogChannelId: number,
  channelId: number, dmId: number): SharedMessageId {
  const data = getData();
  const user = data.users.find(user => user.uId === authUserId);
  const ogChannel = data.channels.find(channel => channel.channelId === ogChannelId);
  const ogMessage = ogChannel.messages.find(message => message.messageId === ogMessageId).message;

  // Error checking
  if (!ogChannel.allMembers.includes(user)) {
    throw HTTPError(BAD_REQUEST, 'message does not exist in a channel which the user is part of');
  }

  if (channelId !== -1) {
    return shareToChannel(token, ogMessage, message, channelId);
  } else {
    return shareToDm(token, ogMessage, message, dmId);
  }
}

/**
 * Shares a message to a channel/DM from a DM
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} authUserId - the user ID of the authenticated user.
 * @param {number} ogMessageId - The message ID of the original message which will be shared
 * @param {string} message - An optional message in addition to the shared message
 * @param {number} ogDmId - the dmId of the DM to share the message from
 * @param {number} channelId - The channelId of the channel to share the message to, or -1 if message
 * is to be shared to a DM
 * @param {number} dmId - The DMId of the DM to share the message to, or -1 if message
 * is to be shared to a channel
 * ...
 *
 * @returns {{ sharedMessageId }} - If successful, return an object containing the sharedMessageId
 */
function shareFromDm
(token: string, authUserId: number, ogMessageId: number, message: string, ogDmId: number,
  channelId: number, dmId: number): SharedMessageId {
  const data = getData();
  const ogDm = data.dms.find(dm => dm.dmId === ogDmId);
  const ogMessage = ogDm.messages.find(message => message.messageId === ogMessageId).message;

  // Error checking
  if (!ogDm.uIds.includes(authUserId)) {
    throw HTTPError(BAD_REQUEST, 'message does not exist in a DM which the user is part of');
  }

  if (channelId !== -1) {
    return shareToChannel(token, ogMessage, message, channelId);
  } else {
    return shareToDm(token, ogMessage, message, dmId);
  }
}

/**
 * Shares a message to a channel
 *
 * @param {string} token - The token of the authenticated user.
 * @param {string} ogMessage - The original message which will be shared
 * @param {string} message - An optional message in addition to the shared message
 * @param {number} dmId - The channelId of the channel to share the message to
 * ...
 *
 * @returns {{ sharedMessageId }} - If successful, return an object containing the sharedMessageId
 */
function shareToChannel(token: string, ogMessage: string, message: string, channelId: number): SharedMessageId {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  const authUserId = getUidFromToken(token);
  const user = data.users.find(user => user.uId === authUserId);
  const senderHandle = data.users.find(user => user.uId === authUserId).handleStr;

  // Error checking
  if (!channel.allMembers.includes(user)) {
    throw HTTPError(FORBIDDEN, 'user does not have permission to share to this channel');
  }

  const sharedMessage = message + '\n\n' + ogMessage;
  const sharedMessageId = messageSendV2(token, channelId, sharedMessage).messageId;

  setData(data);

  tagUser(channelId, -1, senderHandle, message);

  return { sharedMessageId: sharedMessageId };
}

/**
 * Shares a message to a DM
 *
 * @param {string} token - The token of the authenticated user.
 * @param {string} ogMessage - The original message which will be shared
 * @param {string} message - An optional message in addition to the shared message
 * @param {number} dmId - The dmId of the DM to share the message to
 * ...
 *
 * @returns {{ sharedMessageId }} - If successful, return an object containing the sharedMessageId
 */
function shareToDm(token: string, ogMessage: string, message: string, dmId: number): SharedMessageId {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);
  const authUserId = getUidFromToken(token);
  const senderHandle = data.users.find(user => user.uId === authUserId).handleStr;

  // Error checking
  if (!dm.uIds.includes(authUserId)) {
    throw HTTPError(FORBIDDEN, 'user does not have permission to share to this DM');
  }

  const sharedMessage = message + '\n\n' + ogMessage;
  const sharedMessageId = messageSendDmV1(token, dmId, sharedMessage).messageId;

  setData(data);

  tagUser(-1, dmId, senderHandle, message);

  return { sharedMessageId: sharedMessageId };
}

/**
 * Helper function which reacts to a message in a channel
 *
 * @param {number} authUserId - The user ID of the authenticated user.
 * @param {number} messageId - The messageId which will be reacted to
 * @param {number} reactId - the ID of the react
 * @param {number} channelId - The channelId containing the message to be reacted to
 *
 * @returns {void} - If successful, return an object containing the messageId
 */
function reactInChannel(authUserId: number, messageId: number, reactId: number, channelId: number): void {
  const data = getData();
  const user = data.users.find(user => user.uId === authUserId);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  const message = channel.messages.find(message => message.messageId === messageId);
  const react = message.reacts.find(react => react.reactId === reactId);

  // if react exists already
  if (react) {
    if (react.uIds.includes(authUserId)) {
      throw HTTPError(BAD_REQUEST, 'authorized user has already reacted');
    }
    react.uIds.push(authUserId);

  // create a new react
  } else {
    message.reacts.push({ reactId: reactId, uIds: [authUserId], isThisUserReacted: false });
  }

  const reactorHandle = user.handleStr;
  sendReactNotif(channelId, -1, messageId, reactorHandle);

  setData(data);
}

/**
 * Helper function which reacts to a message in a DM
 *
 * @param {number} authUserId - The user ID of the authenticated user.
 * @param {number} messageId - The messageId which will be reacted to
 * @param {number} reactId - the ID of the react
 * @param {number} dmId - The dmId containing the message to be reacted to
 *
 * @returns {void} - If successful, return an object containing the messageId
 */
function reactInDm(authUserId: number, messageId: number, reactId: number, dmId: number): void {
  const data = getData();
  const user = data.users.find(user => user.uId === authUserId);
  const dm = data.dms.find(dm => dm.dmId === dmId);

  const message = dm.messages.find(message => message.messageId === messageId);
  const react = message.reacts.find(react => react.reactId === reactId);

  // if react exists already
  if (react) {
    if (react.uIds.includes(authUserId)) {
      throw HTTPError(BAD_REQUEST, 'authorized user has already reacted');
    }
    react.uIds.push(authUserId);

  // create a new react
  } else {
    message.reacts.push({ reactId: reactId, uIds: [authUserId], isThisUserReacted: false });
  }

  const reactorHandle = user.handleStr;
  sendReactNotif(-1, dmId, messageId, reactorHandle);

  setData(data);
}

/**
 * Helper function which unreacts to a message in a channel
 *
 * @param {number} authUserId - The user ID of the authenticated user.
 * @param {number} messageId - The messageId which will be unreacted to
 * @param {number} reactId - the ID of the react
 * @param {number} channelId - The channelId containing the message to be unreacted to
 *
 * @returns {void} - If successful, return an object containing the messageId
 */
function unreactInChannel(authUserId: number, messageId: number, reactId: number, channelId: number): void {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);

  const message = channel.messages.find(message => message.messageId === messageId);
  const react = message.reacts.find(react => react.reactId === reactId);

  // if react exists already
  if (react) {
    if (!react.uIds.includes(authUserId)) {
      throw HTTPError(BAD_REQUEST, 'authorized user has not reacted');
    }
    react.uIds = react.uIds.filter(uid => uid !== authUserId);
  } else {
    throw HTTPError(BAD_REQUEST, 'react does not exist');
  }

  setData(data);
}

/**
 * Helper function which unreacts to a message in a DM
 *
 * @param {number} authUserId - The user ID of the authenticated user.
 * @param {number} messageId - The messageId which will be unreacted to
 * @param {number} reactId - the ID of the react
 * @param {number} dmId - The dmId containing the message to be unreacted to
 *
 * @returns {void} - If successful, return an object containing the messageId
 */
function unreactInDm(authUserId: number, messageId: number, reactId: number, dmId: number): void {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);

  const message = dm.messages.find(message => message.messageId === messageId);
  const react = message.reacts.find(react => react.reactId === reactId);

  // if react exists already
  if (react) {
    if (!react.uIds.includes(authUserId)) {
      throw HTTPError(BAD_REQUEST, 'authorized user has not reacted');
    }
    react.uIds = react.uIds.filter(uid => uid !== authUserId);
  } else {
    throw HTTPError(BAD_REQUEST, 'react does not exist');
  }

  setData(data);
}

/**
 * Helper function which pins/unpins a message in a channel
 *
 * @param {number} authUserId - The user ID of the authenticated user.
 * @param {number} messageId - The ID of the message to pin/unpin
 * @param {number} channelId - The channel ID of the channel containing the message to pin/unpin
 * @param {boolean} pin - true if message is to be pinned, false otherwise
 * ...
 *
 * @returns {void} - returns void
 */
function changePinChannelMessage(authUserId: number, messageId: number, channelId: number, pin: boolean): void {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  const user = data.users.find(user => user.uId === authUserId);
  const message = channel.messages.find(message => message.messageId === messageId);

  // check if user in channel
  if (!channel.allMembers.includes(user)) {
    throw HTTPError(BAD_REQUEST, 'user is not in channel');
  }
  if (!hasMessagePermissions(authUserId, messageId, channelId, -1)) {
    throw HTTPError(FORBIDDEN, 'user does not have permission to pin/unpin this message');
  }

  // if message will be pinned
  if (pin) {
    if (message.isPinned) {
      throw HTTPError(BAD_REQUEST, 'message is already pinned');
    }
    message.isPinned = true;

  // if message will be unpinned
  } else {
    if (!message.isPinned) {
      throw HTTPError(BAD_REQUEST, 'message is already not pinned');
    }
    message.isPinned = false;
  }
  setData(data);
}

/**
 * Helper function which pins/unpins a message in a DM
 *
 * @param {number} authUserId - The user ID of the authenticated user.
 * @param {number} messageId - The ID of the message to pin/unpin
 * @param {number} dmId - The DM ID of the DM containing the message to pin/unpin
 * @param {boolean} pin - true if message is to be pinned, false otherwise
 * ...
 *
 * @returns {void} - returns void
 */
function changePinDmMessage(authUserId: number, messageId: number, dmId: number, pin: boolean): void {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);
  const message = dm.messages.find(message => message.messageId === messageId);

  // check if user in channel
  if (!dm.uIds.includes(authUserId)) {
    throw HTTPError(BAD_REQUEST, 'user is not in DM');
  }
  if (!hasMessagePermissions(authUserId, messageId, -1, dmId)) {
    throw HTTPError(FORBIDDEN, 'user does not have permission to pin/unpin this message');
  }

  // if message will be pinned
  if (pin) {
    if (message.isPinned) {
      throw HTTPError(BAD_REQUEST, 'message is already pinned');
    }
    message.isPinned = true;

  // if message will be unpinned
  } else {
    if (!message.isPinned) {
      throw HTTPError(BAD_REQUEST, 'message is already not pinned');
    }
    message.isPinned = false;
  }
  setData(data);
}
