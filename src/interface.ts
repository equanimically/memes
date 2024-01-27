// import { port, url } from './config.json';
// import { HOST, PORT } from './server';
import config from './config.json';

// ------------------ SERVER & HTTP CODES ---------------------
// export const SERVER_URL = `${url}:${port}`;
export const OK = 200;
export const FORBIDDEN = 403;
export const BAD_REQUEST = 400;

export const PORT: number = parseInt(process.env.PORT || config.port);
export const HOST: string = process.env.IP || 'localhost';

// ---------------------- PERMISSIONS --------------------------
export const OWNER = 1;
export const MEMBER = 2;

// ------------------------ NOTIFICATIONS ----------------------
export interface Notification {
  channelId: number;
  dmId: number;
  notificationMessage: string;
}

export interface Notifications {
  notifications: Notification[];
}

// -------------------------- STATS --------------------------
export interface ChannelsJoined {
  numChannelsJoined: number;
  timeStamp: number;
}

export interface DmsJoined {
  numDmsJoined: number;
  timeStamp: number;
}

export interface MessagesSent {
  numMessagesSent: number;
  timeStamp: number;
}

export interface UserStats {
  channelsJoined: ChannelsJoined[];
  dmsJoined: DmsJoined[];
  messagesSent: MessagesSent[];
  involvementRate: number;
}

export interface UserStatsReturn {
  userStats: UserStats;
}

export interface ChannelsExist {
  numChannelsExist: number;
  timeStamp: number;
}

export interface DmsExist {
  numDmsExist: number;
  timeStamp: number;
}

export interface MessagesExist {
  numMessagesExist: number;
  timeStamp: number;
}

export interface WorkspaceStats {
  channelsExist: ChannelsExist[];
  dmsExist: DmsExist[];
  messagesExist: MessagesExist[];
  utilizationRate: number;
}

export interface UsersStatsReturn {
  workspaceStats: WorkspaceStats;
}

// -------------------------- MESSAGE --------------------------
export interface Reacts {
  reactId: number;
  uIds: number[];
  isThisUserReacted: boolean;
}

export interface Message {
  messageId: number;
  uId: number;
  message: string;
  timeSent: number;
  reacts: Reacts[];
  isPinned: boolean;
}

export interface MessageId {
  messageId: number;
}

export interface SharedMessageId {
  sharedMessageId: number;
}

export interface Messages {
  messages: Message[];
}

// -------------------------- USER --------------------------
export interface User {
  authUserId: number;
  uId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  handleStr: string;
  userPermissions: number;
  token: string[];
  profileImgUrl: string;
  resetPasswordToken?: string;
  isRemoved: boolean;
  notifications: Notification[];
  userStats: UserStats;
}

export interface UserProfile {
  uId: number;
  email: string;
  nameFirst: string;
  nameLast: string;
  handleStr: string;
  profileImgUrl: string;
}

export interface UserProfiles {
  users: UserProfile[];
}

export interface Members {
  members: User[];
}

// ---------------------------- BOT ----------------------------
export interface Bot {
  authUserId: number;
  uId: number;
  email: string;
  nameFirst: string;
  nameLast: string;
  handleStr: string;
  profileImgUrl: string;
}

export const BOT = -100;

export const K_24: Bot = {
  authUserId: BOT,
  uId: BOT,
  email: '',
  nameFirst: 'K-24',
  nameLast: '🤖',
  handleStr: 'K-24 Bot',
  profileImgUrl: `http://${HOST}:${PORT}/img/k-24-bot.jpg`,
};

// ------------------------- HANGMAN ---------------------------
export const UNDETERMINED = -1;
export const WIN = 1;
export const LOSE = 0;

export const INACTIVE = -1;

export const MAX_INCORRECT_GUESSES = 7;

export interface HangmanGame {
  gameId: number;
  channelId: number;
  dmId: number;
  word: string;
  definition: string;
  maskedWord: string;
  lettersLeft: number;
  guessesLeft: number;
  guesses: string[];
  outcome: number;
}

export interface HangmanGameId {
  gameId: number;
}

export interface Word {
  word: string;
  definition: string;
}

// -------------------------- CHANNEL --------------------------
export interface Channel {
  channelId: number;
  name: string;
  ownerMembers: UserProfile[];
  allMembers: UserProfile[];
  bots: Bot[];
  isPublic: boolean;
  messages: Message[];
  standUpMessageId: number;
  standUpActive: boolean;
  standUpTime: number;
  standUpMessage: Message;
  hangmanGameId: number;
  hangmanActive: boolean;
}

export interface ChannelId {
  channelId: number;
}

export interface ChannelMessages {
  messages: Message[];
  start: number;
  end: number;
}

export interface ChannelSummary {
  channelId: number
  name: string
}

export interface ChannelsList {
  channels: ChannelSummary[];
}

export interface ChannelDetails {
  name: string;
  isPublic: boolean;
  ownerMembers: UserProfile[];
  allMembers: UserProfile[];
}

// --------------------- STAND UPS -----------------------
export interface StandUpActive {
  isActive: boolean;
  timeFinish: number;
}

export interface TimeFinish {
  timeFinish: number;
}

// -------------------------- DM --------------------------
export interface DM {
  dmId: number;
  name: string;
  ownerId: number;
  uIds: number[];
  messages: Message[];
  bots: Bot[];
  hangmanGameId: number;
  hangmanActive: boolean;
}

export interface DMMessages {
  messages: Message[];
  start: number;
  end: number;
}

export interface DMSummary {
  dmId: number;
  name: string;
}

export interface DMList {
  dms: DMSummary[];
}

export interface DMDetails {
  name: string;
  members: UserProfile[];
}

export interface DMId {
  dmId: number;
}

// -------------------------- OTHER --------------------------
export interface Error {
  error: string;
}

// -------------------------- DATASTORE --------------------------
export interface DataStore {
  users: User[];
  bots: Bot[];
  channels: Channel[];
  dms: DM[];
  messageId: number;
  games: HangmanGame[];
  workspaceStats: WorkspaceStats;
}
