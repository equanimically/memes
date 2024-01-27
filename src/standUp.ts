import HTTPError from 'http-errors';
import {
  getData,
  setData,
} from './dataStore';
import {
  BAD_REQUEST,
  FORBIDDEN,
  Message,
  StandUpActive,
  TimeFinish,
} from './interface';
import {
  getUidFromToken,
  isUserIdValid,
  isChannelIdValid,
  getTime,
  genMessageId,
} from './other';
import { updateNumMessages, updateNumMessagesSent } from './stats';

/**
   * For a given channel, starts a standup period lasting length seconds.
   *
   * @param {string} token - The token of the authenticated user.
   * @param {number} channelId - The ID of the channel to start a standup in.
   * @param {number} length - The length of the standup (in seconds)
   * ...
   *
   * @returns {{ timeFinish: time }} - the finishing time of the standup
*/
export function standUpStartV1 (token: string, channelId: number, length: number): TimeFinish {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'Channel does not exist');
  }
  if (channel.standUpActive === true) {
    throw HTTPError(BAD_REQUEST, 'StandUp is already active');
  }
  if (length < 0) {
    throw HTTPError(BAD_REQUEST, 'Length must be a positive integer');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'Requester is not a member of the channel');
  }

  const time = getTime() + length;
  const standUpMessage = setStandUpActive(token, channelId, time);

  setTimeout(() => {
    deactivateStandUp(channelId, standUpMessage);
    updateNumMessages(true);
    updateNumMessagesSent(authUserId);
    setData(data);
  }, length * 1000);

  return { timeFinish: time };
}

/**
 * Helper function which sets a standup to 'active'
 *
 * @param {DataStore} data - The stored data
 * @param {number} channelId - The ID of the channel to set the standup in
 * @param {number} time - The finishing time of the standup
 * ...
 *
 * @returns {void} - returns nothing
 */
function setStandUpActive(token: string, channelId: number, time: number) {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  if (channel !== undefined) {
    channel.standUpActive = true;
    channel.standUpTime = time;
  }

  const newMessage: Message = {
    messageId: genMessageId(),
    uId: getUidFromToken(token),
    message: '',
    timeSent: time,
    reacts: [],
    isPinned: false,
  };

  channel.standUpMessage = newMessage;

  return newMessage;
}

/**
 * Helper function which deactivates a standup
 *
 * @param {DataStore} data - The stored data
 * @param {number} channelId - The ID of the channel to deactivate the standup in
 * @param {string} token - The token of the authenticated user
 * ...
 *
 * @returns {void} - returns nothing
 */
function deactivateStandUp(channelId: number, message: Message) {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);

  if (channel !== undefined) {
    channel.standUpActive = false;
    channel.standUpTime = null;
    channel.messages.push(message);
  }
}

/**
   * For a given channel, if a standup is currently active in the channel,
   * sends a message to get buffered in the standup queue.
   *
   * @param {string} token - The token of the authenticated user.
   * @param {number} channelId - The ID of the channel which is having a standup.
   * @param {string} message - the message to send to the standup
   * ...
   *
   * @returns {{}} - An empty object
*/
export function standUpSendV1(token: string, channelId: number, message: string): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const channel = data.channels.find(channel => channel.channelId === channelId);

  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'invalid user');
  }
  if (channel.standUpActive === false) {
    throw HTTPError(BAD_REQUEST, 'no active standup in target channel');
  }
  if (message.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'message too long');
  }
  if (!channel.allMembers.some(member => member.uId === authUserId)) {
    throw HTTPError(FORBIDDEN, 'user is not a member of target channel');
  }

  const user = data.users.find(user => user.uId === authUserId);

  let standupMessageStr = channel.standUpMessage.message;
  if (standupMessageStr.length > 0) {
    standupMessageStr += '\n';
  }

  standupMessageStr += `${user.handleStr}: ${message}`;

  channel.standUpMessage.message = standupMessageStr;

  setData(data);
  return {};
}

/**
 * For a given channel, returns whether a standup is active in it, and what time
 * the standup finishes.
 *
 * If no standup is active, then timeFinish should be null.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} channelId - The ID of the channel which will be checked for an
 * active standup
 * ...
 *
 * @returns {{ isActive: boolean, timeFinish: number }} - if successful
 */
export function standUpActiveV1(token: string, channelId: number): StandUpActive {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  const authUserId = getUidFromToken(token);

  // Check if the channel exists before validating the channelId
  if (authUserId === undefined) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  if (!isChannelIdValid(channelId)) {
    throw HTTPError(BAD_REQUEST, 'invalid channel');
  }
  if (channel.allMembers.some(member => member.uId === getUidFromToken(token)) === false) {
    throw HTTPError(FORBIDDEN, 'user is not a member of target channel');
  }

  return {
    isActive: channel.standUpActive,
    timeFinish: channel.standUpTime
  };
}
