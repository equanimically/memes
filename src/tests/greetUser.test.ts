import { BOT } from '../interface';
import {
  requestClearV1,
  requestAuthRegisterV3,
  requestChannelsCreateV3,
  requestChannelMessagesV3,
  requestChannelJoinV3,
} from '../wrappers';

let token1: string;

beforeEach(() => {
  requestClearV1();
  const user1 = requestAuthRegisterV3('bobsmith@gmail.com', '123Password', 'Bob', 'Smith');
  token1 = user1.token;
});

afterEach(() => {
  requestClearV1();
});

test('successfully greets a user when joining channel', () => {
  const channelId1 = requestChannelsCreateV3(token1, 'publicChannel', true).channelId;
  const user2 = requestAuthRegisterV3('janesmith@gmail.com', 'Password123', 'Jane', 'Smith');
  const token2 = user2.token;
  requestChannelJoinV3(token2, channelId1);
  expect(requestChannelMessagesV3(token1, channelId1, 0)).toStrictEqual({
    messages: [
      {
        messageId: 0,
        uId: BOT,
        message: 'Hello @janesmith! 👋 Welcome to publicChannel!',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
    ],
    start: 0,
    end: -1,
  });
});
