import {
  getUidFromHandle,
  getUidFromToken,
  isUserIdValid,
} from './other';
import {
  FORBIDDEN,
  Notification,
  Notifications,
} from './interface';
import {
  getData,
  setData,
} from './dataStore';
import HTTPError from 'http-errors';

/**
* Retrieves the 20 most recent notifications for the authenticated user.
*
* @param {string} token - The token of the authenticated user.
* ...
*
* @returns {Notifications} - An object containing an array of the 20 most recent notifications for the user.
*
*/
export function notificationsGetV1(token: string): Notifications {
  const data = getData();
  const authUserId = getUidFromToken(token);

  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  const user = data.users.find(user => user.uId === authUserId);
  const recentNotifications = user.notifications.slice(0, 20);
  return { notifications: recentNotifications };
}

/**
 * Tags a user in a message.
 *
 * @param {number} inChannelId - the ID of the channel which contains the message with the tag,
 * or, -1 if the message is in a DM
 * @param {number} inDmId - the ID of the DM which contains the message with the tag,
 * or, -1 if the message is in a channel
 * @param {string} senderHandle - the handle of the sender who tagged another user in a message
 * @param {string} messageWithTag - the message which contains the tag
 * ...
 *
 * @returns {void} - returns nothing
 */
export function tagUser(inChannelId: number, inDmId: number, senderHandle: string, messageWithTag: string): void {
  const usersToTag = new Set<string>();

  let nextHandleIndex = 0;

  // while there are still @ after the current index
  while (messageWithTag.indexOf('@', nextHandleIndex) !== -1) {
    nextHandleIndex = messageWithTag.indexOf('@', nextHandleIndex);

    // remove @ symbol for the current tag
    let tagStr = messageWithTag.substring(nextHandleIndex).slice(1);

    // remove everything after the first non-alphanumeric character
    const tagStrToRemove = tagStr.search(/[^A-Za-z0-9 ]/);
    if (tagStrToRemove !== -1) {
      tagStr = tagStr.substring(0, tagStrToRemove);
    }
    usersToTag.add(tagStr);
    nextHandleIndex++;
  }
  usersToTag.forEach(handle => sendTagNotif(inChannelId, inDmId, messageWithTag, handle, senderHandle));
}

/**
 * Sends a notification to a user if they have been tagged in a message.
 *
 * @param {number} inChannelId - the ID of the channel which contains the message with the tag,
 * or, -1 if the message is in a DM
 * @param {number} inDmId - the ID of the DM which contains the message with the tag,
 * or, -1 if the message is in a channel
 * @param {string} messageWithTag - the message which contains the tag
 * @param {string} recipientHandle - the handle of the user who was tagged
 * @param {string} senderHandle - the handle of the sender who tagged another user
 * ...
 *
 * @returns {void} - returns nothing
 */
export function sendTagNotif(inChannelId: number, inDmId: number, messageWithTag: string, recipientHandle: string, senderHandle: string): void {
  const data = getData();
  const recipientUid = getUidFromHandle(recipientHandle);
  const recipient = data.users.find(user => user.uId === recipientUid);
  const channel = data.channels.find(channel => channel.channelId === inChannelId);
  const dm = data.dms.find(dm => dm.dmId === inDmId);

  if (!isUserIdValid(recipientUid)) {
    return;
  }

  // if in tagged user is in channel
  if (inChannelId !== -1 && channel.allMembers.includes(recipient)) {
    const notificationMsg = `${senderHandle} tagged you in ${channel.name}: ${messageWithTag.slice(0, 20)}`;
    notificationSend(inChannelId, -1, notificationMsg, recipientUid);
  }

  // if in tagged user is in DM
  if (inDmId !== -1 && dm.uIds.includes(recipientUid)) {
    const notificationMsg = `${senderHandle} tagged you in ${dm.name}: ${messageWithTag.slice(0, 20)}`;
    notificationSend(-1, inDmId, notificationMsg, recipientUid);
  }
}

/**
 * Sends a notification to a user if their message has been reacted to.
 *
 * @param {number} inChannelId - the ID of the channel which contains the reacted message
 * or, -1 if the message is in a DM
 * @param {number} inDmId - the ID of the DM which contains the reacted message,
 * or, -1 if the message is in a channel
 * @param {number} messageId - the messageId of the message which was reacted to
 * @param {string} reactorHandle - the handle of the user who reacted to the message
 * ...
 *
 * @returns {void} - returns nothing
 */
export function sendReactNotif(inChannelId: number, inDmId: number, messageId: number, reactorHandle: string): void {
  const data = getData();
  let notificationMsg: string;

  // if message is in channel
  if (inChannelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === inChannelId);
    const reactedMsgSenderUid = channel.messages.find(message => message.messageId === messageId).uId;
    notificationMsg = `${reactorHandle} reacted to your message in ${channel.name}`;
    notificationSend(inChannelId, -1, notificationMsg, reactedMsgSenderUid);

  // if message is in DM
  } else if (inDmId !== -1) {
    const dm = data.dms.find(dm => dm.dmId === inDmId);
    const reactedMsgSenderUid = dm.messages.find(message => message.messageId === messageId).uId;
    notificationMsg = `${reactorHandle} reacted to your message in ${dm.name}`;
    notificationSend(-1, inDmId, notificationMsg, reactedMsgSenderUid);
  }
}

/**
 * Sends a notification to a user if they were added to a channel
 *
 * @param {number} inChannelId - the ID of the channel which the user was added to
 * or -1 if the user was invited to a DM
 * @param {number} inDmId - the ID of the DM which the user was added to
 * or -1 if the user was invited to a channel
 * @param {string} inviterHandle - the handle of the user who invited the other user
 * @param {number} recipientUid - the uId of the user who was
 * ...
 *
 * @returns {void} - returns nothing
 */
export function sendAddNotif(inChannelId: number, inDmId: number, inviterHandle: string, recipientUid: number) {
  const data = getData();
  let notificationMsg: string;

  if (inChannelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === inChannelId);
    notificationMsg = `${inviterHandle} added you to ${channel.name}`;
    notificationSend(inChannelId, -1, notificationMsg, recipientUid);
  } else if (inDmId !== -1) {
    const dm = data.dms.find(dm => dm.dmId === inDmId);
    notificationMsg = `${inviterHandle} added you to ${dm.name}`;
    notificationSend(-1, inDmId, notificationMsg, recipientUid);
  }
}

/**
 * Helper function which sends a notification to a user.
 *
 * @param {number} inChannelId - the ID of the channel which the event happened in,
 * or -1 if it is being sent to a DM
 * @param {number} inDmId - the ID of the DM which the event happened in,
 * or -1 if it is being sent to a channel
 * @param {string} message - the message which will be sent as a notification
 * @param {number} recipientUid - the uId of the user who will receive the notification
 * ...
 *
 * @returns {void} - returns nothing
 */
function notificationSend(inChannelId: number, inDmId: number, message: string, recipientUid: number): void {
  const data = getData();
  const recipient = data.users.find(user => user.uId === recipientUid);
  const notification: Notification = {
    channelId: inChannelId,
    dmId: inDmId,
    notificationMessage: message
  };
  recipient.notifications.unshift(notification);
  setData(data);
}
