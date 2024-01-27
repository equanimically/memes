import HTTPError from 'http-errors';
import { ChannelsJoined, DmsJoined, FORBIDDEN, MessagesSent, UserStatsReturn, UsersStatsReturn } from './interface';
import { getTime, getUidFromToken } from './other';
import { getData, setData } from './dataStore';

/**
  * Gets the stats of a given user
  *
  * @param {string} token - The token of the authenticated user.
  *
  * @returns {UserStatsReturn} - if successful
*/
export function userStatsV1(token: string): UserStatsReturn {
  const data = getData();
  const authUserId = getUidFromToken(token);
  if (authUserId === undefined) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }
  const user = data.users.find((user) => user.authUserId === authUserId);
  user.userStats.involvementRate = getInvolvementRate(authUserId);
  return { userStats: user.userStats };
}

/**
  * Gets the stats of the overall workspace
  *
  * @param {string} token - The token of the authenticated user.
  *
  * @returns {UsersStatsReturn} - if successful
*/
export function usersStatsV1(token: string): UsersStatsReturn {
  const data = getData();
  const authUserId = getUidFromToken(token);
  if (authUserId === undefined) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  data.workspaceStats.utilizationRate = getUtilizationRate();
  return { workspaceStats: data.workspaceStats };
}

/**
  * Helper function which updates the number of channels a given
  * user has joined
  *
  * @param {string} token - The token of the authenticated user.
  * @param {boolean} increase - indicates whether the number of channels joined
  * should be increased or decreased
  *
  * @returns {void} - returns nothing
*/
export function updateNumChannelsJoined(authUserId: number, increase: boolean): void {
  const data = getData();
  const user = data.users.find((user) => user.authUserId === authUserId);
  const channelsJoined = user.userStats.channelsJoined;

  // get the most recent number of channels joined
  let numChannelsJoined = channelsJoined[channelsJoined.length - 1].numChannelsJoined;
  if (increase) {
    numChannelsJoined++;
  } else {
    numChannelsJoined--;
  }

  const newChannelStats: ChannelsJoined = {
    numChannelsJoined,
    timeStamp: getTime()
  };

  user.userStats.channelsJoined.push(newChannelStats);
  setData(data);
}

/**
  * Helper function which updates the number of DMs a given
  * user has joined
  *
  * @param {string} token - The token of the authenticated user.
  * @param {boolean} increase - indicates whether the number of DMs joined
  * should be increased or decreased
  *
  * @returns {void} - returns nothing
*/
export function updateNumDmsJoined(authUserId: number, increase: boolean): void {
  const data = getData();
  const user = data.users.find((user) => user.authUserId === authUserId);
  const dmsJoined = user.userStats.dmsJoined;

  // get the most recent number of dms joined
  let numDmsJoined = dmsJoined[dmsJoined.length - 1].numDmsJoined;
  if (increase) {
    numDmsJoined++;
  } else {
    numDmsJoined--;
  }

  const newDmStats: DmsJoined = {
    numDmsJoined,
    timeStamp: getTime()
  };

  user.userStats.dmsJoined.push(newDmStats);
  setData(data);
}

/**
  * Helper function which updates the number of messages a given
  * user has sent
  *
  * @param {string} token - The token of the authenticated user.
  *
  * @returns {void} - returns nothing
*/
export function updateNumMessagesSent(authUserId: number): void {
  const data = getData();
  const user = data.users.find((user) => user.authUserId === authUserId);
  const messagesSent = user.userStats.messagesSent;

  // get the most recent number of messages sent
  const numMessagesSent = messagesSent[messagesSent.length - 1].numMessagesSent;
  const newMessageStats: MessagesSent = {
    numMessagesSent: numMessagesSent + 1,
    timeStamp: getTime()
  };

  messagesSent.push(newMessageStats);
  setData(data);
}

/**
  * Helper function which calculates the involvement rate of a given user
  *
  * @param {string} token - The token of the authenticated user.
  *
  * @returns {number} - returns the involvement rate of the given user
*/
function getInvolvementRate(authUserId: number): number {
  const data = getData();
  const user = data.users.find((user) => user.authUserId === authUserId);
  let involvementRate;

  // get the user's channels, dms and messages
  const channelsJoined = user.userStats.channelsJoined;
  const dmsJoined = user.userStats.dmsJoined;
  const messagesSent = user.userStats.messagesSent;

  // get the most recent number of channels, dms and messages
  const numChannelsJoined = channelsJoined[channelsJoined.length - 1].numChannelsJoined;
  const numDmsJoined = dmsJoined[dmsJoined.length - 1].numDmsJoined;
  const numMessagesSent = messagesSent[messagesSent.length - 1].numMessagesSent;

  // get the total number of channels, dms and messages
  const numChannels = data.channels.length;
  const numDms = data.dms.length;

  const messagesExist = data.workspaceStats.messagesExist;
  const numMessages = messagesExist[messagesExist.length - 1].numMessagesExist;

  const numerator = (numChannelsJoined + numDmsJoined + numMessagesSent);
  const denominator = (numChannels + numDms + numMessages);

  if (denominator === 0) {
    involvementRate = 0;
  } else {
    involvementRate = numerator / denominator;
  }

  if (involvementRate > 1) {
    involvementRate = 1;
  }

  return involvementRate;
}

/**
  * Helper function which updates the number of channels that currently
  * exist
  *
  * @returns {void} - returns nothing
*/
export function updateNumChannels(): void {
  const data = getData();
  data.workspaceStats.channelsExist.push({
    numChannelsExist: data.channels.length,
    timeStamp: getTime()
  });
  setData(data);
}

/**
  * Helper function which updates the number of DMs that currently
  * exist
  *
  * @returns {void} - returns nothing
*/
export function updateNumDms(): void {
  const data = getData();
  data.workspaceStats.dmsExist.push({
    numDmsExist: data.dms.length,
    timeStamp: getTime()
  });
  setData(data);
}

/**
  * Helper function which updates the number of messages that currently
  * exist
  *
  * @param {boolean} increase - indicates whether the number of messages
  * should be increased or decreased
  *
  * @returns {void} - returns nothing
*/
export function updateNumMessages(increase: boolean): void {
  const data = getData();
  const messagesExist = data.workspaceStats.messagesExist;
  let numMessagesExist = messagesExist[messagesExist.length - 1].numMessagesExist;

  if (increase) {
    numMessagesExist++;
  } else {
    numMessagesExist--;
  }

  data.workspaceStats.messagesExist.push({
    numMessagesExist,
    timeStamp: getTime()
  });
}

/**
  * Helper function which calculates the utilization rate of the workspace
  *
  * @returns {number} - returns the utilization rate of the workspace
*/
function getUtilizationRate(): number {
  const data = getData();

  // get the total number of users who have not been removed
  const nonRemovedUsers = data.users.filter(user => user.isRemoved === false);
  const numUsers = nonRemovedUsers.length;

  // get the number of users who have joined at least one channel
  const channelUsers = nonRemovedUsers.filter((user) => {
    const lastChannelJoined = user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1];
    return lastChannelJoined.numChannelsJoined !== 0;
  });
  const numUsersJoinedChannel = channelUsers.length;

  // get the number of users who have joined at least one dm
  const dmUsers = nonRemovedUsers.filter((user) => {
    const lastDmJoined = user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1];
    return lastDmJoined.numDmsJoined !== 0;
  });
  const numUsersJoinedDm = dmUsers.length;

  return (numUsersJoinedChannel + numUsersJoinedDm) / numUsers;
}
