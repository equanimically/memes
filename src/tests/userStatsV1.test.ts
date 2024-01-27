import {
  requestUserStatsV1,
  requestMessageSendV2,
  requestClearV1,
  requestAuthRegisterV3,
  requestChannelsCreateV3,
  requestDmCreateV2,
  requestMessageSendDmV2,
  requestChannelJoinV3,
  requestChannelInviteV3,
  requestChannelLeaveV2,
  requestDmLeaveV2,
  requestDmRemoveV2,
  requestMessageSendLaterV1,
  requestMessageSendLaterDmV1,
  requestMessageShareV1,
  requestStandupStartV1,
  requestStandupSendV1,
  requestMessageRemoveV2,
  requestAdminUserRemoveV1,
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

describe('/user/stats/v1', () => {
  test('invalid token', () => {
    expect(requestUserStatsV1('invalid')).toStrictEqual(FORBIDDEN);
  });

  test('update user stats when creating a channel', () => {
    requestChannelsCreateV3(token1, 'test', true);
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when sending a message in a channel', () => {
    const channel = requestChannelsCreateV3(token1, 'test', true);
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
    requestMessageSendV2(token1, channel.channelId, 'hi');
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when being invited to a channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestChannelInviteV3(token1, channelId1, uId2);
    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when joining a channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestChannelJoinV3(token2, channelId1);
    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when leaving a channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestChannelJoinV3(token2, channelId1);
    requestChannelLeaveV2(token2, channelId1);
    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when creating a dm', () => {
    requestDmCreateV2(token1, [uId2]);
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when sending a message in a dm', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    requestMessageSendDmV2(token1, dmId1, 'hi');
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when leaving a dm', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    requestDmLeaveV2(token1, dmId1);
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when removing a dm', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    requestDmRemoveV2(token1, dmId1);
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when user sends a delayed message in channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestMessageSendLaterV1(token1, channelId1, 'hi', Math.floor(Date.now() / 1000) + 1);
    const timeSent = Math.floor(Date.now() / 1000);

    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent + 2) break;
    }

    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when user sends a delayed message in dm', () => {
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    requestMessageSendLaterDmV1(token1, dmId1, 'hi', Math.floor(Date.now() / 1000) + 1);
    const timeSent = Math.floor(Date.now() / 1000);

    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent + 2) break;
    }

    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when sharing a message', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, 'hi').messageId;

    // create second channel
    const channelId2 = requestChannelsCreateV3(token1, 'test2', true).channelId;

    // share messageId 1 to channel 2
    requestMessageShareV1(token1, messageId1, '', channelId2, -1);
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 2,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 2,
            timeStamp: expect.any(Number),
          }
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('update user stats when user is the starter of a standup', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestStandupStartV1(token1, channelId1, 1.5);
    const timeSent = Math.floor(Date.now() / 1000);
    requestStandupSendV1(token1, channelId1, 'hi');
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    // wait until standup is done
    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent + 2.5) break;
    }

    // message should now be sent
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          }
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  // standupstart starter
  test('do not update user stats when user is not starter of a standup', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestChannelJoinV3(token2, channelId1);

    // start standup
    requestStandupStartV1(token1, channelId1, 1.5);
    const timeSent = Math.floor(Date.now() / 1000);

    // user 2 sends message in standup
    requestStandupSendV1(token2, channelId1, 'hi');
    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    // wait until standup is done
    while (true) {
      const time = Math.floor(Date.now() / 1000);
      if (time > timeSent + 2.5) break;
    }

    // numMessagesSent should still be 0
    expect(requestUserStatsV1(token2)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
        ],
        involvementRate: expect.any(Number),
      }
    });

    // user 1's numMessagesSent should be 1
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          }
        ],
        involvementRate: expect.any(Number),
      }
    });
  });

  test('involvement rate denominator is 0', () => {
    // make a dm
    const dmId1 = requestDmCreateV2(token1, []).dmId;

    // send a message in the dm
    requestMessageSendDmV2(token1, dmId1, 'hi');

    // verify that numDmsJoined and numMessagesSent has increased
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          }
        ],
        involvementRate: expect.any(Number),
      }
    });

    // remove the DM
    requestDmRemoveV2(token1, dmId1);

    // involvementRate = (0 + 0 + 1) / (0 + 0 + 0)
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 1,
            timeStamp: expect.any(Number),
          },
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          }
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          }
        ],
        involvementRate: 0,
      }
    });
  });

  test('involvement rate > 1 is capped at 1', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, 'hi').messageId;

    // remove message
    requestMessageRemoveV2(token1, messageId1);

    // involvementRate = (1 + 0 + 1) / (1 + 0 + 0)
    expect(requestUserStatsV1(token1)).toStrictEqual({
      userStats: {
        channelsJoined: [
          {
            numChannelsJoined: 0,
            timeStamp: expect.any(Number),
          },
          {
            numChannelsJoined: 1,
            timeStamp: expect.any(Number),
          }
        ],
        dmsJoined: [
          {
            numDmsJoined: 0,
            timeStamp: expect.any(Number),
          },
        ],
        messagesSent: [
          {
            numMessagesSent: 0,
            timeStamp: expect.any(Number),
          },
          {
            numMessagesSent: 1,
            timeStamp: expect.any(Number),
          }
        ],
        involvementRate: 1,
      }
    });
  });

  test('removed user cannot call user/stats', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'test', true).channelId;
    requestChannelJoinV3(token2, channelId1);
    requestDmCreateV2(token1, [uId2]);
    requestAdminUserRemoveV1(token1, uId2);
    expect(requestUserStatsV1(token2)).toStrictEqual(FORBIDDEN);
  });
});
