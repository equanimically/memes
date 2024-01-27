import express, {
  json,
  Request,
  Response
} from 'express';
import {
  echo
} from './echo';
import {
  authRegisterV3,
  authLoginV3,
  authLogoutV2,
  authPasswordResetRequestV1,
  authPasswordResetResetV1,
} from './auth';
import {
  clearV1
} from './other';
import {
  channelsCreateV3,
  channelsListAllV3,
  channelsListV3,
} from './channels';
import {
  userProfileV3,
  usersAllV2,
  userProfileSetNameV2,
  userProfileSetEmailV2,
  userProfileSetHandleV2,
  userProfileSetProfileImgUrlV1
} from './users';
import {
  channelDetailsV3,
  channelJoinV3,
  channelLeaveV2,
  channelAddOwnerV2,
  channelInviteV3,
  channelMessagesV3,
  channelRemoveOwnerV2
} from './channel';
import {
  messageRemoveV1,
  messageSendDmV1,
  messageSendV2,
  messageEditV2,
  messageSendLaterV1,
  messageSendLaterDmV1,
  messageShareV1,
  messageReactV1,
  messageUnreactV1,
  messagePinV1,
  messageUnpinV1,
} from './message';
import {
  dmCreateV2,
  dmListV2,
  dmRemoveV2,
  dmDetailsV2,
  dmLeaveV2,
  dmMessagesV2,
} from './dm';
import {
  adminUserPermissionChangeV1,
} from './admin';
import {
  standUpStartV1,
  standUpSendV1,
  standUpActiveV1,
} from './standUp';
import {
  searchV1
} from './searchV1';
import { setData } from './dataStore';
import fs from 'fs';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import { adminUserRemoveV1 } from './admin';
import { notificationsGetV1 } from './notifications';
import { usersStatsV1, userStatsV1 } from './stats';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
app.use('/img', express.static('img'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

// ===================== Auth =====================
app.post('/auth/register/v3', (req: Request, res: Response, next) => {
  const { email, password, nameFirst, nameLast } = req.body;
  res.json(authRegisterV3(email, password, nameFirst, nameLast));
});

app.post('/auth/login/v3', (req: Request, res: Response, next) => {
  const { email, password } = req.body;
  res.json(authLoginV3(email, password));
});

app.post('/auth/logout/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  res.json(authLogoutV2(token));
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response, next) => {
  const { email } = req.body;
  res.json(authPasswordResetRequestV1(email));
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response, next) => {
  const { resetCode, newPassword } = req.body;
  res.json(authPasswordResetResetV1(resetCode, newPassword));
});
// ===================== Channel =====================
app.post('/channel/invite/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, uId } = req.body;
  return res.json(channelInviteV3(token, channelId, uId));
});

app.post('/channel/join/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId } = req.body;
  return res.json(channelJoinV3(token, channelId));
});

app.get('/channel/details/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = parseInt(req.query.channelId as string);
  res.json(channelDetailsV3(token, channelId));
});

app.get('/channel/messages/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = parseInt(req.query.channelId as string);
  const start = parseInt(req.query.start as string);
  return res.json(channelMessagesV3(token, channelId, start));
});
// ===================== Channels =====================
app.post('/channels/create/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const { name, isPublic } = req.body;
  res.json(channelsCreateV3(token, name, isPublic));
});

app.get('/channels/list/v3', (req: Request, res: Response) => {
  res.json(channelsListV3(req.header('token')));
});

app.get('/channels/listAll/v3', (req: Request, res: Response) => {
  res.json(channelsListAllV3(req.header('token')));
});

app.post('/channel/leave/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId } = req.body;
  res.json(channelLeaveV2(token, channelId));
});

app.post('/channel/addowner/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, uId } = req.body;
  res.json(channelAddOwnerV2(token, channelId, uId));
});

app.post('/channel/removeowner/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, uId } = req.body;
  res.json(channelRemoveOwnerV2(token, channelId, uId));
});

// ===================== DMs =====================
app.post('/dm/create/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { uIds } = req.body;
  res.json(dmCreateV2(token, uIds));
});

app.get('/dm/list/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  res.json(dmListV2(token));
});

app.delete('/dm/remove/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId } = req.query;
  res.json(dmRemoveV2(token as string, parseInt(dmId as string, 10)));
});

app.get('/dm/details/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId } = req.query;
  res.json(dmDetailsV2(token as string, parseInt(dmId as string, 10)));
});

app.post('/dm/leave/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId } = req.body;
  res.json(dmLeaveV2(token, dmId));
});

app.get('/dm/messages/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId, start } = req.query;
  res.json(dmMessagesV2(token as string, parseInt(dmId as string, 10), parseInt(start as string, 10)));
});

// ===================== Users =====================
app.get('/user/profile/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const uId = parseInt(req.query.uId as string, 10); // Provide the radix as the second argument

  res.json(userProfileV3(token, uId));
});

app.get('/users/all/v2', (req: Request, res: Response) => {
  const token = req.header('token');

  res.json(usersAllV2(token));
});

app.put('/user/profile/setname/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const nameFirst = req.body.nameFirst;
  const nameLast = req.body.nameLast;

  res.json(userProfileSetNameV2(token, nameFirst, nameLast));
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const email = req.body.email;

  res.json(userProfileSetEmailV2(token, email));
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const handleStr = req.body.handleStr;

  res.json(userProfileSetHandleV2(token, handleStr));
});

app.post('/user/profile/uploadphoto/v1', async (req: Request, res: Response) => {
  const token = req.header('token');
  const imgUrl = req.body.imgUrl;
  const { xStart, yStart, xEnd, yEnd } = req.body;
  try {
    const result = await userProfileSetProfileImgUrlV1(token, imgUrl, xStart, yStart, xEnd, yEnd);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal server error' });
  }
});

// ===================== Messages =====================
app.delete('/message/remove/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const mId = parseInt(req.query.messageId as string, 10);
  res.json(messageRemoveV1(token, mId));
});

app.post('/message/senddm/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId, message } = req.body;
  res.json(messageSendDmV1(token, dmId, message));
});

app.post('/message/send/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message } = req.body;
  res.json(messageSendV2(token, channelId, message));
});

app.put('/message/edit/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const messageId = req.body.messageId;
  const message = req.body.message;
  res.json(messageEditV2(token, messageId, message));
});

app.post('/message/sendlater/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message, timeSent } = req.body;
  res.json(messageSendLaterV1(token, channelId, message, timeSent));
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId, message, timeSent } = req.body;
  res.json(messageSendLaterDmV1(token, dmId, message, timeSent));
});

app.post('/message/share/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { ogMessageId, message, channelId, dmId } = req.body;
  res.json(messageShareV1(token, ogMessageId, message, channelId, dmId));
});

app.post('/message/react/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, reactId } = req.body;
  res.json(messageReactV1(token, messageId, reactId));
});

app.post('/message/unreact/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, reactId } = req.body;
  res.json(messageUnreactV1(token, messageId, reactId));
});

app.post('/message/pin/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId } = req.body;
  res.json(messagePinV1(token, messageId));
});

app.post('/message/unpin/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId } = req.body;
  res.json(messageUnpinV1(token, messageId));
});

// ===================== Admin =====================
app.delete('/admin/user/remove/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const uId = parseInt(req.query.uId as string, 10);
  res.json(adminUserRemoveV1(token, uId));
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { uId, permissionId } = req.body;
  res.json(adminUserPermissionChangeV1(token, uId, permissionId));
});

// ==================== StandUp ====================
app.post('/standup/start/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, length } = req.body;
  res.json(standUpStartV1(token, channelId, length));
});

app.post('/standup/send/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message } = req.body;
  res.json(standUpSendV1(token, channelId, message));
});

app.get('/standup/active/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = parseInt(req.query.channelId as string);
  res.json(standUpActiveV1(token, channelId));
});

// ===================== Notifications =====================
app.get('/notifications/get/v1', (req: Request, res: Response, next) => {
  const token = req.header('token');
  res.json(notificationsGetV1(token));
});

// ======================= Search =======================
app.get('/search/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const queryStr = req.query.queryStr as string;
  res.json(searchV1(token, queryStr));
});

// ======================= Stats =======================
app.get('/user/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  res.json(userStatsV1(token));
});

app.get('/users/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  res.json(usersStatsV1(token));
});

// ===================== Clear =====================
app.delete('/clear/v1', (req: Request, res: Response) => {
  res.json(clearV1());
});

// Keep this BENEATH route definitions
// handles errors nicely
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  if (fs.existsSync('src/database.json')) {
    const dbStr = fs.readFileSync('src/database.json');
    setData(JSON.parse(String(dbStr)));
  }
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
