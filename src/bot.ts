import { getData, setData } from './dataStore';
import { ADMIN_CHANNEL_HELP, ADMIN_DM_HELP, CHANNEL_OWNER_HELP, HANGMAN_USAGE, HELP } from './botCommands';
import { Message, BOT, MessageId } from './interface';
import { genMessageId, getHandleFromUid, getTime, getUidFromHandle, getUidFromToken, hasChannelOwnerPermissions, isChannelIdValid, isChannelMember, isChannelOwner, isGlobalOwner, isHandleValid } from './other';
import { hangmanEndV1, hangmanGuessV1, hangmanStartV1 } from './hangman';
import { channelAddOwnerV2, channelInviteV3, channelRemoveOwnerV2 } from './channel';
import { adminUserPermissionChangeV1 } from './admin';

/**
 * Checks whether a given message is a K-24 Bot command.
 * Assumes that the token, channel/DM are valid.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} channelId - The ID of the channel to which the message was sent,
 * or -1 if the message was sent to a DM
 * @param {number} dmId - The ID of the DM to which the message was sent,
 * or -1 if the message was sent to a channel
 * @param {string} message - the message which will be checked for a bot command
 * ...
 *
 * @returns {void} - returns void
 */
export function botCheckCommandV1(token: string, channelId: number, dmId: number, message: string): void {
  const authUserId = getUidFromToken(token);
  const senderHandle = getHandleFromUid(authUserId);
  const helpIntro = `Hello @${senderHandle}! 👋 Here are the commands you can use 🙂\n\n`;
  // /help
  if (message === '/help') {
    // check perms
    if (channelId !== -1 && isGlobalOwner(authUserId)) {
      botSendV1(channelId, dmId, helpIntro + ADMIN_CHANNEL_HELP);
    } else if (dmId !== -1 && isGlobalOwner(authUserId)) {
      botSendV1(channelId, dmId, helpIntro + ADMIN_DM_HELP);
    } else if (channelId !== -1 && isChannelOwner(authUserId, channelId)) {
      botSendV1(channelId, dmId, helpIntro + CHANNEL_OWNER_HELP);
    } else {
      botSendV1(channelId, dmId, helpIntro + HELP);
    }
  } else if (message.includes('/help')) {
    botSendV1(channelId, dmId, 'Usage: /help');

    // /hello
  } else if (message === '/hello') {
    botSendV1(channelId, dmId, `Hello, @${senderHandle} 😀!`);
  } else if (message.includes('/hello')) {
    botSendV1(channelId, dmId, 'Usage: /hello');

  // /hangman start
  } else if (message === '/hangman start') {
    hangmanStartV1(channelId, dmId);
  } else if (message.includes('/hangman start')) {
    botSendV1(channelId, dmId, 'Usage: /hangman start');

  // /hangman end
  } else if (message === '/hangman end') {
    hangmanEndV1(channelId, dmId);
  } else if (message.includes('/hangman end')) {
    botSendV1(channelId, dmId, 'Usage: /hangman end');

  // /hangman guess
  } else if (message.includes('/guess')) {
    const match = /^\/guess\s+([a-zA-Z])$/i.exec(message);
    if (!match) {
      botSendV1(channelId, dmId, 'Usage: /guess <letter>');
    } else {
      const guess = match[1];
      hangmanGuessV1(channelId, dmId, guess);
    }
  } else if (message.includes('/hangman')) {
    botSendV1(channelId, dmId, HANGMAN_USAGE);

  // /invite
  } else if (message.includes('/invite')) {
    const match = /^\/invite\s+@(\S+)/i.exec(message);
    if (!match) {
      botSendV1(channelId, dmId, 'Usage: /invite @<handleStr>');
    } else {
      const handle = match[1];
      botInviteV1(token, handle, channelId, dmId);
    }

  // /owneradd
  } else if (message.includes('/owneradd')) {
    const match = /^\/owneradd\s+@(\S+)/i.exec(message);
    if (!match) {
      botSendV1(channelId, dmId, 'Usage: /owneradd @<handleStr>');
    } else {
      if (channelId !== -1 && !hasChannelOwnerPermissions(authUserId, channelId)) {
        botSendV1(channelId, dmId, 'You do not have permission to use this command!');
      } else {
        const handle = match[1];
        const uId = getUidFromHandle(handle);
        botOwnerAddRemoveV1(token, handle, channelId, dmId, uId, true);
      }
    }

  // /ownerremove
  } else if (message.includes('/ownerremove')) {
    const match = /^\/ownerremove\s+@(\S+)/i.exec(message);
    if (!match) {
      botSendV1(channelId, dmId, 'Usage: /ownerremove @<handleStr>');
    } else {
      if (channelId !== -1 && !hasChannelOwnerPermissions(authUserId, channelId)) {
        botSendV1(channelId, dmId, 'You do not have permission to use this command!');
      } else {
        const handle = match[1];
        const uId = getUidFromHandle(handle);
        botOwnerAddRemoveV1(token, handle, channelId, dmId, uId, false);
      }
    }

  // /perms
  } else if (message.includes('/perms')) {
    const match = /^\/perms\s+@(\S+)\s+([12])$/i.exec(message);
    if (!match) {
      botSendV1(channelId, dmId, 'Usage: /perms @<handleStr> <1|2>');
    } else {
      if (!isGlobalOwner(authUserId)) {
        botSendV1(channelId, dmId, 'You do not have permission to use this command!');
      } else {
        const handle = match[1];
        const uId = getUidFromHandle(handle);
        const perms = parseInt(match[2]);
        botPermissionChangeV1(token, handle, channelId, dmId, uId, perms);
      }
    }
  }
}

/**
 * Sends a message from the K-24 Bot to the given channel/dm.
 * Assumes channel/DM ID is valid.
 *
 * @param {number} channelId - The ID of the channel which the message will be sent to,
 * or -1 if it will be sent to a DM
 * @param {number} dmId - The ID of the DM which the message will be sent to,
 * or -1 if it will be sent to a channel
 * @param {string} message - The message which will be sent by K-24
 * ...
 *
 * @returns {MessageId} - an object containing the messageId
 */
export function botSendV1(channelId: number, dmId: number, message: string): MessageId {
  const data = getData();
  const newMessage: Message = {
    messageId: genMessageId(),
    uId: BOT,
    message,
    timeSent: getTime(),
    reacts: [],
    isPinned: false,
  };

  if (channelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    channel.messages.push(newMessage);
  } else {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    dm.messages.push(newMessage);
  }

  setData(data);
  return { messageId: newMessage.messageId };
}

/**
 * Deals with most error cases for inviting a user to a channel but sends errors as messages
 * from K-24 to the channel/DM rather than throwing a HTTP error
 *
 * @param {string} token - The token of the authenticated user
 * @param {string} handleStr - the handle of the user who will be invited
 * @param {number} channelId - The ID of the channel which the invite message will be
 * sent to, or -1 if it will be sent to a DM
 * @param {number} dmId - The ID of the DM which the invite message will be sent to,
 * or -1 if it will be sent to a channel
 * ...
 *
 * @returns {void} - returns nothing
 */
function botInviteV1(token: string, handleStr: string, channelId: number, dmId: number) {
  const uId = getUidFromHandle(handleStr);
  if (!isChannelIdValid(channelId)) {
    botSendV1(channelId, dmId, 'This command can only be used in channels!');
    return;
  }
  if (!isHandleValid(handleStr)) {
    botSendV1(channelId, dmId, 'Invalid handle!');
    return;
  }
  if (isChannelMember(uId, channelId)) {
    botSendV1(channelId, dmId, `@${handleStr} is already a member of this channel!`);
    return;
  }
  channelInviteV3(token, channelId, uId);
}

/**
 * Deals with most error cases for adding/removing an owner from a channel but sends errors
 * as messages from K-24 to the channel/DM rather than throwing a HTTP error
 *
 * @param {string} token - The token of the authenticated user
 * @param {string} handleStr - the handle of the user who will be added/removed as an owner
 * @param {number} channelId - The ID of the channel which the owner add/remove message will be
 * sent to, or -1 if it will be sent to a DM
 * @param {number} dmId - The ID of the DM which the owner add/remove message will be sent to,
 * or -1 if it will be sent to a channel
 * @param {number} uId - The user ID of the user who will be added/removed as an owner
 * @param {boolean} add - indicates whether the user should be added/removed
 * ...
 *
 * @returns {void} - returns nothing
 */
function botOwnerAddRemoveV1(token: string, handleStr: string, channelId: number,
  dmId: number, uId: number, add: boolean): void {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  if (!isChannelIdValid(channelId)) {
    botSendV1(channelId, dmId, 'This command can only be used in channels!');
    return;
  }
  if (!isHandleValid(handleStr)) {
    botSendV1(channelId, dmId, 'Invalid handle!');
    return;
  }
  if (add) {
    if (isChannelOwner(uId, channelId)) {
      botSendV1(channelId, dmId, `@${handleStr} is already an owner of this channel!`);
      return;
    }
    channelAddOwnerV2(token, channelId, uId);
    botSendV1(channelId, dmId, `@${handleStr} has been added as an owner!`);
  } else {
    if (!isChannelOwner(uId, channelId)) {
      botSendV1(channelId, dmId, `@${handleStr} is not an owner of this channel!`);
      return;
    }
    if (channel.ownerMembers.length === 1) {
      botSendV1(channelId, dmId, 'There must be at least one channel owner!');
      return;
    }
    channelRemoveOwnerV2(token, channelId, uId);
    botSendV1(channelId, dmId, `@${handleStr} has been removed as an owner!`);
  }
}

/**
 * Deals with most error cases for changing user permissions but sends errors as messages
 * from K-24 to the channel/DM rather than throwing a HTTP error
 *
 * @param {string} token - The token of the authenticated user
 * @param {string} handleStr - the handle of the user whose permissions will be changed
 * @param {number} channelId - The ID of the channel which the request is being made from,
 * or -1 if it is being made from a DM
 * @param {number} dmId - The ID of the DM which the request is being made from,
 * or -1 if it is being made from a channel
 * @param {number} uId - The user ID of the user who will have their permissions changed
 * @param {number} permissionId - The permission ID which will be given to the user
 * ...
 *
 * @returns {void} - returns nothing
 */
function botPermissionChangeV1(token: string, handleStr: string, channelId: number,
  dmId: number, uId: number, permissionId: number) {
  const data = getData();
  const user = data.users.find(u => u.uId === uId);
  if (!isHandleValid(handleStr)) {
    botSendV1(channelId, dmId, 'Invalid handle!');
    return;
  }
  if (data.users.filter(u => isGlobalOwner(u.uId)).length === 1 && isGlobalOwner(uId) === true) {
    botSendV1(channelId, dmId, 'There must be at least one global owner!');
    return;
  }
  if (user.userPermissions === permissionId) {
    botSendV1(channelId, dmId, `@${handleStr} already has this permission!`);
    return;
  }
  adminUserPermissionChangeV1(token, uId, permissionId);
  botSendV1(channelId, dmId, `@${handleStr} has been given permission ${permissionId}!`);
}
