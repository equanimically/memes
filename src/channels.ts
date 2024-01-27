import {
  getData,
  setData,
} from './dataStore';
import {
  ChannelId,
  ChannelsList,
  Message,
  BAD_REQUEST,
  FORBIDDEN,
  K_24,
} from './interface';
import {
  getUidFromToken,
  isUserIdValid,
} from './other';
import HTTPError from 'http-errors';
import { updateNumChannels, updateNumChannelsJoined } from './stats';

/**
  * Creates a new channel with the given name and adds it to the list of channels.
  * The channel owner and members are initialized to the authUserId,
  * and the channel is marked as either public or private.
  *
  * @param {string} token - The token of the authenticated user.
  * @param {boolean} isPublic - A boolean indicating whether the channel is public or private.
  * ...
  *
  * @returns {{channelId}} - If successful, returns an object containing the ID of the new channel
*/
export function channelsCreateV3(token: string, name: string, isPublic: boolean): ChannelId {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (name.length < 1 || name.length > 20) {
    throw HTTPError(BAD_REQUEST, 'Channel name must be between 1 and 20 characters');
  }
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  const ownerUserProfile = data.users.find(user => user.authUserId === authUserId);
  const allMembersProfiles = [ownerUserProfile]; // Start with owner user profile

  const initialStandUpMsg: Message = {
    messageId: -1,
    uId: -1,
    message: '',
    timeSent: -1,
    reacts: [],
    isPinned: false
  };

  data.channels.push({
    channelId: data.channels.length,
    name: name,
    ownerMembers: [ownerUserProfile],
    allMembers: allMembersProfiles,
    bots: [K_24],
    isPublic: isPublic,
    messages: [],
    standUpMessageId: -1,
    standUpTime: 0,
    standUpActive: false,
    standUpMessage: initialStandUpMsg,
    hangmanActive: false,
    hangmanGameId: -1,
  });

  updateNumChannelsJoined(authUserId, true);
  updateNumChannels();

  setData(data);
  return { channelId: data.channels.length - 1 };
}

/**
  * Returns a list of all channels that the authenticated user is a member of.
  *
  * @param {string} token - The token of the authenticated user.
  * ...
  *
  * @returns {{channels}} - If successful, returns an object containing an array of the user's channels
*/
export function channelsListV3(token: string): ChannelsList {
  const data = getData();
  const authUserId = getUidFromToken(token);
  const allChannels = data.channels;

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  const userChannels = allChannels.filter(channel => {
    return channel.allMembers.some(member => member.uId === authUserId);
  });

  const userChannelsData = userChannels.map(channel => {
    return {
      channelId: channel.channelId,
      name: channel.name
    };
  });

  // console.log(userChannelsData);

  return { channels: userChannelsData };
}

/**
  * Returns a list of all channels that the authenticated user is a member of.
  *
  * @param {string} token - The token of the authenticated user.
  * ...
  *
  * @returns {{channels}} - If successful, returns an object containing an array of all channels
*/
export function channelsListAllV3(token: string): ChannelsList {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  const channels = data.channels.map(channel => {
    return {
      channelId: channel.channelId,
      name: channel.name
    };
  });

  return { channels: channels };
}

// EOF
