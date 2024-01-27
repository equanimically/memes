import {
  BAD_REQUEST,
  FORBIDDEN,
  Message,
  Messages,
} from './interface';
import {
  getData,
} from './dataStore';
import {
  getUidFromToken,
} from './other';
import HTTPError from 'http-errors';

/**
 * Searches messages from channels and direct messages (DMs) for a specific query string.
 * The function will search messages from channels that the user is a member of and DMs
 * that the user is a part of or owns. The search is case-insensitive.
 *
 * @param {string} token - The token associated with the user account.
 * @param {string} queryStr - The query string to be searched in messages.
 *
 * @returns {{ messages }} - Returns an object containing an array of messages that match the query string.
 */
export function searchV1(token:string, queryStr:string): Messages {
  const data = getData();
  const uId = getUidFromToken(token);
  if (uId === undefined) {
    throw HTTPError(FORBIDDEN, 'invalid token');
  }
  if (queryStr.length < 1 || queryStr.length > 1000) {
    throw HTTPError(BAD_REQUEST, 'query string must be between 1 and 1000 characters');
  }
  const messages: Message[] = [];
  data.channels.forEach(channel => {
    if (channel.allMembers.some(member => member.uId === uId)) {
      channel.messages.forEach(message => {
        if (message.message.toLowerCase().includes(queryStr.toLowerCase())) {
          messages.push(message);
        }
      });
    }
  });
  data.dms.forEach(dm => {
    if (dm.uIds.some(uIds => uIds === uId) || dm.ownerId === uId) {
      dm.messages.forEach(message => {
        if (message.message.toLowerCase().includes(queryStr.toLowerCase())) {
          messages.push(message);
        }
      });
    }
  });
  return { messages };
}
