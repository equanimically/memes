import { ADMIN_CHANNEL_HELP, ADMIN_DM_HELP, CHANNEL_OWNER_HELP, HELP } from '../botCommands';
import { BOT } from '../interface';
import {
  requestMessageSendV2,
  requestClearV1,
  requestAuthRegisterV3,
  requestChannelsCreateV3,
  requestChannelMessagesV3,
  requestDmCreateV2,
  requestMessageSendDmV2,
  requestDmMessagesV2,
  requestChannelInviteV3,
} from '../wrappers';

let token1: string;
let uId1: number;

beforeEach(() => {
  requestClearV1();
  const user1 = requestAuthRegisterV3('bobsmith@gmail.com', '123Password', 'Bob', 'Smith');
  token1 = user1.token;
  uId1 = user1.authUserId;
});

afterEach(() => {
  requestClearV1();
});

describe('/help', () => {
  test('/help for global owner in channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'publicChannel', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, '/help').messageId;
    expect(requestChannelMessagesV3(token1, channelId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Hello @bobsmith! 👋 Here are the commands you can use 🙂\n\n' +
                    ADMIN_CHANNEL_HELP,
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: '/help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/help for channel owner in channel', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const token2 = user2.token;
    const channelId2 = requestChannelsCreateV3(token2, 'publicChannel', true).channelId;
    const messageId1 = requestMessageSendV2(token2, channelId2, '/help').messageId;
    expect(requestChannelMessagesV3(token2, channelId2, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Hello @janesmith! 👋 Here are the commands you can use 🙂\n\n' +
                    CHANNEL_OWNER_HELP,
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId2,
          message: '/help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/help for member in channel', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const token2 = user2.token;
    const channelId1 = requestChannelsCreateV3(token1, 'publicChannel', true).channelId;
    requestChannelInviteV3(token1, channelId1, uId2);
    const messageId1 = requestMessageSendV2(token2, channelId1, '/help').messageId;
    expect(requestChannelMessagesV3(token2, channelId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: expect.any(Number),
          uId: BOT,
          message: 'Hello @janesmith! 👋 Here are the commands you can use 🙂\n\n' +
                    HELP,
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId2,
          message: '/help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: expect.any(Number),
          uId: BOT,
          message: 'Hello @janesmith! 👋 Welcome to publicChannel!',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
  });

  test('/help used incorrectly in channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'publicChannel', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, 'I said /help').messageId;
    expect(requestChannelMessagesV3(token1, channelId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Usage: /help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: 'I said /help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/help for global owner in dm', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const messageId1 = requestMessageSendDmV2(token1, dmId1, '/help').messageId;
    expect(requestDmMessagesV2(token1, dmId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Hello @bobsmith! 👋 Here are the commands you can use 🙂\n\n' +
                    ADMIN_DM_HELP,
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: '/help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/help for non-global owner in dm', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const token2 = user2.token;
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const messageId1 = requestMessageSendDmV2(token2, dmId1, '/help').messageId;
    expect(requestDmMessagesV2(token2, dmId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Hello @janesmith! 👋 Here are the commands you can use 🙂\n\n' +
                    HELP,
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId2,
          message: '/help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/help used incorrectly in dm', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const token2 = user2.token;
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const messageId1 = requestMessageSendDmV2(token2, dmId1, '/help me').messageId;
    expect(requestDmMessagesV2(token2, dmId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Usage: /help',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId2,
          message: '/help me',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });
});
