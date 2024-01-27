import {
  requestUsersStatsV1,
  requestMessageSendV2,
  requestClearV1,
  requestAuthRegisterV3,
  requestChannelsCreateV3,
  requestDmCreateV2,
  requestMessageSendDmV2,
  requestDmRemoveV2,
  requestMessageSendLaterV1,
  requestMessageSendLaterDmV1,
  requestMessageRemoveV2,
  requestMessageEditV2,
  requestChannelJoinV3,
  requestStandupStartV1,
  requestStandupSendV1,
  requestMessageShareV1,
} from '../wrappers';
import {
  FORBIDDEN,
} from '../interface';

let token1: string;
let token2: string;
let uId2: number;

beforeEach(() => {
  requestClearV1();
  const user1 = requestAuthRegisterV3('bobsmith@gmail.com', '123Password', 'Bob', 'Smith');
  token1 = user1.token;

  const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
  token2 = user2.token;
  uId2 = user2.authUserId;
});

afterEach(() => {
  requestClearV1();
});

describe('/users/stats/v1', () => {
  test('invalid token', () => {
    expect(requestUsersStatsV1('invalid')).toStrictEqual(FORBIDDEN);
  });

  test('update workspace stats when sending a message', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const channel = requestChannelsCreateV3(token1, 'test', true);
    requestMessageSendV2(token1, channel.channelId, 'hi');
    requestMessageSendDmV2(token1, dmId1, 'hi');
    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 2,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });
  });

  test('update workspace stats when sending a delayed message', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestMessageSendLaterV1(token1, channelId1, 'hi', Math.floor(Date.now() / 1000) + 1.5);
    const timeSent = Math.floor(Date.now() / 1000);

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });

    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent + 2.5) break;
    }

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });

    requestMessageSendLaterDmV1(token1, dmId1, 'hi', Math.floor(Date.now() / 1000) + 1.5);
    const timeSent2 = Math.floor(Date.now() / 1000);

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });

    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent2 + 2.5) break;
    }

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 2,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });
  });

  test('update workspace stats when removing a dm', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    requestMessageSendDmV2(token1, dmId1, 'hi');
    requestMessageSendDmV2(token1, dmId1, 'hi');
    requestDmRemoveV2(token1, dmId1);
    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 2,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          }
        ],
        utilizationRate: expect.any(Number),
      }
    });
  });

  test('update workspace stats when a message is removed', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, 'hi').messageId;
    const messageId2 = requestMessageSendV2(token1, channelId1, 'to edit').messageId;
    requestMessageRemoveV2(token1, messageId1);
    requestMessageEditV2(token1, messageId2, '');
    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 2,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          }
        ],
        utilizationRate: expect.any(Number),
      }
    });
  });

  test('update workspace stats only once when a standup message is sent', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestChannelJoinV3(token2, channelId1);

    // start standup
    requestStandupStartV1(token1, channelId1, 1.5);
    const timeSent = Math.floor(Date.now() / 1000);

    // user 2 sends message in standup
    requestStandupSendV1(token1, channelId1, 'hi');
    requestStandupSendV1(token2, channelId1, 'hi');

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });

    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent + 2) break;
    }

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });
  });

  test('update workspace stats only once when a message is shared', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    const channelId2 = requestChannelsCreateV3(token1, 'test2', true).channelId;

    const messageId1 = requestMessageSendV2(token1, channelId1, 'hi').messageId;
    requestMessageShareV1(token1, messageId1, '', channelId2, -1);

    expect(requestUsersStatsV1(token1)).toStrictEqual({
      workspaceStats: {
        channelsExist: [
          {
            numChannelsExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsExist: 2,
            timeStamp: expect.any(Number),
          },
        ],
        dmsExist: [
          {
            numDmsExist: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesExist: [
          {
            numMessagesExist: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesExist: 2,
            timeStamp: expect.any(Number),
          },
        ],
        utilizationRate: expect.any(Number),
      }
    });
  });
});
