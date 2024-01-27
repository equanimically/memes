import {
  getData, setData
} from './dataStore';

/**
 * Clears the users and channels data arrays.
 *
 * @returns {Object} An empty object.
 */
export function clearV1(): Record<never, never> {
  const data = getData();
  data.users = [];
  data.channels = [];
  data.dms = [];
  data.messageId = 0;
  data.bots = [];
  data.games = [];
  data.workspaceStats = {
    channelsExist: [{ numChannelsExist: 0, timeStamp: getTime() }],
    dmsExist: [{ numDmsExist: 0, timeStamp: getTime() }],
    messagesExist: [{ numMessagesExist: 0, timeStamp: getTime() }],
    utilizationRate: 0,
  };
  setData(data);
  return {};
}

/**
 * Checks if the given authentication user ID is valid.
 *
 * @param {string} authUserId - The authentication user ID to check.
 * ...
 *
 * @returns {boolean} True if the user ID is valid
 * @returns {boolean} False if the user ID is not valid
 */
export function isUserIdValid(authUserId: number) {
  const data = getData();
  return data.users.some(user => user.authUserId === authUserId);
}

/**
 * Checks if the given channel ID is valid.
 *
 * @param {string} channelId - The channel ID to check.
 * ...
 * @returns {boolean} True if the channel ID is valid
 * @returns {boolean} False if the channel ID is not valid
 */
export function isChannelIdValid(channelId: number) {
  const data = getData();
  return data.channels.some(channel => channel.channelId === channelId);
}

/**
 * Checks if the given DM ID is valid.
 *
 * @param {string} channelId - The DM ID to check.
 * ...
 * @returns {boolean} True if the DM ID is valid
 * @returns {boolean} False if the DM ID is not valid
 */
export function isDmIdValid(dmId: number): boolean {
  const data = getData();
  return data.dms.some(dm => dm.dmId === dmId);
}

/**
 * Checks if the given channel ID belongs to a private channel.
 *
 * @param {string} channelId - The channel ID to check.
 * ...
 *
 * @returns {boolean} True if the channel is private
 * @returns {boolean} False if it's public or if the channel ID is invalid
 */
export function isPrivateChannel(channelId: number) {
  const data = getData();
  const channel = data.channels.find(c => c.channelId === channelId);
  return channel && !channel.isPublic;
}

/**
 * Checks if the given authentication user ID is a global owner.
 *
 * @param {string} authUserId - The authentication user ID to check.
 * ...
 *
 * @returns {boolean} True if the user is a global owner
 * @returns {boolean} False if the user is not a global owner
 */
export function isGlobalOwner(authUserId: number) {
  const data = getData();
  const user = data.users.find((user) => user.authUserId === authUserId);
  if (user && user.userPermissions === 1) {
    return true;
  }
  return undefined;
}

/**
 * Checks if the given authentication user ID is a channel owner.
 *
 * @param {string} authUserId - The authentication user ID to check.
 * @param {number} channelId - The ID of the channel
 * ...
 *
 * @returns {boolean} True if the user is a channel owner
 * @returns {boolean} False if the user is not a channel owner
 */
export function isChannelOwner(authUserId: number, channelId: number) {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  return channel.ownerMembers.find(user => user.uId === authUserId);
}

/**
 * Checks if the given authentication user ID is a channel member.
 *
 * @param {string} authUserId - The authentication user ID to check.
 * @param {number} channelId - The ID of the channel
 * ...
 *
 * @returns {boolean} True if the user is a channel member
 * @returns {boolean} False if the user is not a channel member
 */
export function isChannelMember(authUserId: number, channelId: number) {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  return channel.allMembers.find(user => user.uId === authUserId);
}

/**
 * Given a token, returns the corresponding authUserId (uId) from the data store.
 *
 * @param {string} token - The token to lookup.
 * ...
 *
 * @returns {number} The corresponding authUserId (uId) if the token is valid
 * @returns {null} If the token is invalid
 */
export function getUidFromToken(token: string) {
  const user = getData().users.find(user => user.token.includes(token));
  return user?.token.includes(token) ? user.uId : undefined;
}

/**
 * Given a handle, returns the corresponding authUserId (uId) from the data store.
 *
 * @param {string} handle - The handle to lookup.
 * ...
 *
 * @returns {number} The corresponding authUserId (uId) if the handle is valid
 * @returns {null} If the handle is invalid
 */
export function getUidFromHandle(handle: string) {
  const data = getData();
  const user = data.users.find((user) => user.handleStr === handle);
  if (user === undefined) {
    return undefined;
  }
  return user.uId;
}

/**
 * Checks whether a given user ID has owner permissions in a channel
 *
 * @param {number} authUserId - the user ID of the user who's channel permissions
 * will be checked
 * @param {number} channelId - the channel ID of the channel which the user's
 * permissions will be checked in
 * ...
 *
 * @returns {boolean} returns true if the user has channel permissions, and undefined
 * if they do not
 */
export function hasChannelOwnerPermissions(authUserId: number, channelId: number): boolean {
  const data = getData();
  const user = data.users.find(user => user.authUserId === authUserId);
  if (data.channels[channelId].ownerMembers.some(member => member.uId === authUserId) ||
  (data.channels[channelId].allMembers.some(member => member.uId === authUserId) &&
  user.userPermissions === 1)) {
    return true;
  }
  return undefined;
}

/**
 * Checks whether a given user ID has owner permissions in a DM
 *
 * @param {number} authUserId - the user ID of the user who's DM permissions
 * will be checked
 * @param {number} dmId - the DM ID of the DM which the user's
 * permissions will be checked in
 * ...
 *
 * @returns {boolean} returns true if the user has DM permissions, and undefined
 * if they do not
 */
export function hasDmOwnerPermissions(authUserId: number, dmId: number): boolean {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);
  return dm.ownerId === authUserId;
}

/**
 * Generates a new messageId
 *
 * @returns {number} returns the new messageId that was generated
 */
export function genMessageId(): number {
  const data = getData();
  const mId = data.messageId;
  data.messageId = data.messageId + 1;
  setData(data);
  return mId;
}

/**
 * Checks whether a given message is in a channel
 *
 * @param {number} messageId - the message ID of the message which location will be checked
 * ...
 *
 * @returns {number | undefined} if message is in channel, returns the channel ID of the channel containing
 * the message, or, returns undefined if not in channel
 */
export function messageInChannel(messageId: number): number {
  const data = getData();
  const inChannel = data.channels.some(channel => channel.messages.some(message => message.messageId === messageId));
  if (inChannel) {
    // return channelId
    const channelId = data.channels.find(channel => channel.messages.some(message => message.messageId === messageId)).channelId;
    return channelId;
  } else {
    return -1;
  }
}

/**
 * Checks whether a given message is in a DM
 *
 * @param {number} messageId - the message ID of the message which location will be checked
 * ...
 *
 * @returns {number | undefined} if message is in DM, returns the DM ID of the DM containing
 * the message, or, returns undefined if not in DM
 */
export function messageInDm(messageId: number): number {
  const data = getData();
  const inDm = data.dms.some(dm => dm.messages.some(message => message.messageId === messageId));
  if (inDm) {
    // return dmId
    const dmId = data.dms.find(dm => dm.messages.some(message => message.messageId === messageId)).dmId;
    return dmId;
  } else {
    return -1;
  }
}

/**
 * Gets the current unix timestamp (in seconds)
 *
 * @param {} void no parameter
 *
 * @returns {number} the unix timestamp in seconds
 */
export function getTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Gets the handle associated with a given uId
 *
 * @param {number} uId - The user ID of the authenticated user.
 *
 * @returns {string | undefined} - returns the handlestr of the given user
 * if the user exists, or undefined if the user doesn't exist
 */
export function getHandleFromUid(uId: number): string | undefined {
  const data = getData();
  const user = data.users.find(user => user.uId === uId);
  return user?.handleStr;
}

/**
 * Helper function which checks whether a handle is valid
 *
 * @param {string} handleStr - The handle which will be checked
 * ...
 * @returns {boolean} - returns true if the handle is valid, false otherwise
 */
export function isHandleValid(handleStr: string): boolean {
  const data = getData();
  const handle = data.users.find(user => user.handleStr === handleStr);
  if (handle) {
    return true;
  }
  return false;
}
