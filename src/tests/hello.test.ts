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

describe('/hello', () => {
  test('/hello used correctly in channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'publicChannel', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, '/hello').messageId;
    expect(requestChannelMessagesV3(token1, channelId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Hello, @bobsmith 😀!',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: '/hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/hello used incorrectly in channel', () => {
    const channelId1 = requestChannelsCreateV3(token1, 'publicChannel', true).channelId;
    const messageId1 = requestMessageSendV2(token1, channelId1, '/hello world').messageId;
    expect(requestChannelMessagesV3(token1, channelId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Usage: /hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: '/hello world',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/hello in dm', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const messageId1 = requestMessageSendDmV2(token1, dmId1, '/hello').messageId;
    expect(requestDmMessagesV2(token1, dmId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Hello, @bobsmith 😀!',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: '/hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
      ],
      start: 0,
      end: -1,
    });
  });

  test('/hello used incorrectly in dm', () => {
    const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
    const uId2 = user2.authUserId;
    const dmId1 = requestDmCreateV2(token1, [uId2]).dmId;
    const messageId1 = requestMessageSendDmV2(token1, dmId1, 'I said /hello').messageId;
    expect(requestDmMessagesV2(token1, dmId1, 0)).toStrictEqual({
      messages: [
        {
          messageId: 1,
          uId: BOT,
          message: 'Usage: /hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1,
          uId: uId1,
          message: 'I said /hello',
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
