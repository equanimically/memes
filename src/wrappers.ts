import request from 'sync-request';
import { port, url } from './config.json';
import { OK } from './interface';

const SERVER_URL = `${url}:${port}`;

/**
 * HTTP wrapper functions for all channel, channels, users, dm, and message functions.
 *
 * @param - take in the same parameters as the original function
 *
 * @returns - returns parsed return object from original function
 */

// -------------------------------------- AUTH --------------------------------------
export function requestAuthLoginV3(email: string, password: string) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/login/v3',
    {
      json: {
        email,
        password
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestAuthRegisterV3(email: string, password: string, nameFirst: string, nameLast: string) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/register/v3',
    {
      json: {
        email,
        password,
        nameFirst,
        nameLast
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestAuthLogoutV2(token: string) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/logout/v2',
    {
      headers: {
        token,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestAuthPasswordResetRequestV1(email: string) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/passwordreset/request/v1',
    {
      json: {
        email,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestAuthPasswordResetResetV1(resetCode: string, newPassword: string) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/passwordreset/reset/v1',
    {
      json: {
        resetCode,
        newPassword,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- CHANNEL --------------------------------------
export function requestChannelsCreateV3(token: string, name: string, isPublic: boolean) {
  const res = request(
    'POST',
    SERVER_URL + '/channels/create/v3',
    {
      headers: {
        token
      },
      json: {
        name,
        isPublic
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelsListV3(token:string) {
  const res = request(
    'GET',
    SERVER_URL + '/channels/list/v3',
    {
      headers: {
        token
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelsListAllV3(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/channels/listAll/v3',
    {
      headers: {
        token
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelDetailsV3(token: string, channelId: number) {
  const res = request(
    'GET',
    SERVER_URL + '/channel/details/v3',
    {
      headers: {
        token
      },
      qs: {
        channelId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelJoinV3(token: string, channelId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/join/v3',
    {
      headers: {
        token
      },
      json: {
        channelId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelInviteV3(token: string, channelId: number, uId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/invite/v3',
    {
      headers: {
        token
      },
      json: {
        channelId,
        uId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelMessagesV3(token: string, channelId: number, start: number) {
  const res = request(
    'GET',
    SERVER_URL + '/channel/messages/v3',
    {
      headers: {
        token
      },
      qs: {
        channelId,
        start
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelLeaveV2(token: string, channelId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/leave/v2',
    {
      headers: {
        token
      },
      json: {
        channelId,
      },
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelAddOwnerV2(token: string, channelId: number, uId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/addowner/v2',
    {
      headers: {
        token
      },
      json: {
        channelId,
        uId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestChannelRemoveOwnerV2(token: string, channelId: number, uId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/removeowner/v2',
    {
      headers: {
        token
      },
      json: {
        channelId,
        uId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- USER --------------------------------------
export function requestUserProfileV3(token: string, uId: number) {
  const res = request(
    'GET',
    SERVER_URL + '/user/profile/v3',
    {
      qs: {
        uId,
      },
      headers: {
        token
      }
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestUsersAllV2(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/users/all/v2',
    {
      headers: {
        token,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }

  return JSON.parse(res.getBody() as string);
}

export function requestUserProfileSetNameV2(token: string, nameFirst: string, nameLast: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/user/profile/setname/v2',
    {
      json: {
        nameFirst,
        nameLast,
      },
      headers: {
        token
      }
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestUserProfileSetEmailV2(token: string, email: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/user/profile/setemail/v2',
    {
      json: {
        email,
      },
      headers: {
        token
      }
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestUserProfileSetHandleV2(token: string, handleStr: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/user/profile/sethandle/v2',
    {
      json: {
        handleStr,
      },
      headers: {
        token
      }
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestUserProfileSetProfileImgUrlV1(token: string,
  imgUrl: string,
  xStart: number,
  yStart: number,
  xEnd: number,
  yEnd: number) {
  const res = request(
    'POST',
    SERVER_URL + '/user/profile/uploadphoto/v1',
    {
      headers: {
        token
      },
      json: {
        imgUrl,
        xStart,
        yStart,
        xEnd,
        yEnd
      }
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- MESSAGE --------------------------------------
export function requestMessageSendV2(token: string, channelId: number, message: string) {
  const res = request(
    'POST',
    SERVER_URL + '/message/send/v2',
    {
      headers: {
        token,
      },
      json: {
        channelId,
        message,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageEditV2(token: string, messageId: number, message: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/message/edit/v2',
    {
      headers: {
        token,
      },
      json: {
        messageId,
        message,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageRemoveV2(token: string, messageId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + '/message/remove/v2',
    {
      headers: {
        token,
      },
      qs: {
        messageId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendDmV2(token: string, dmId: number, message: string) {
  const res = request(
    'POST',
    SERVER_URL + '/message/senddm/v2',
    {
      headers: {
        token,
      },
      json: {
        dmId,
        message,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendLaterDmV1(token: string, dmId: number, message: string, timeSent: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/sendlaterdm/v1',
    {
      headers: {
        token,
      },
      json: {
        dmId,
        message,
        timeSent,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendLaterV1(token: string, channelId: number, message: string, timeSent: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/sendlater/v1',
    {
      headers: {
        token: token
      },
      json: {
        channelId,
        message,
        timeSent
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/share/v1',
    {
      headers: {
        token: token
      },
      json: {
        ogMessageId,
        message,
        channelId,
        dmId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageReactV1(token:string, messageId: number, reactId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/react/v1',
    {
      headers: {
        token: token
      },
      json: {
        messageId,
        reactId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageUnreactV1(token:string, messageId: number, reactId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/unreact/v1',
    {
      headers: {
        token: token
      },
      json: {
        messageId,
        reactId
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessagePinV1(token: string, messageId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/pin/v1',
    {
      headers: {
        token: token
      },
      json: {
        messageId,
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestMessageUnpinV1(token: string, messageId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/unpin/v1',
    {
      headers: {
        token: token
      },
      json: {
        messageId,
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- DM --------------------------------------
export function requestDmCreateV2(token: string, uIds: number[]) {
  const res = request(
    'POST',
    SERVER_URL + '/dm/create/v2',
    {
      headers: {
        token,
      },
      json: {
        uIds,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestDmListV2(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/dm/list/v2',
    {
      headers: {
        token,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestDmRemoveV2(token: string, dmId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + '/dm/remove/v2',
    {
      headers: {
        token,
      },
      qs: {
        dmId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestDmDetailsV2(token: string, dmId: number) {
  const res = request(
    'GET',
    SERVER_URL + '/dm/details/v2',
    {
      headers: {
        token,
      },
      qs: {
        dmId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestDmLeaveV2(token: string, dmId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/dm/leave/v2',
    {
      headers: {
        token,
      },
      json: {
        dmId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestDmMessagesV2(token: string, dmId: number, start: number) {
  const res = request(
    'GET',
    SERVER_URL + '/dm/messages/v2',
    {
      headers: {
        token,
      },
      qs: {
        dmId,
        start,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- CLEAR --------------------------------------
export function requestClearV1() {
  const res = request(
    'DELETE',
    SERVER_URL + '/clear/v1',
    {
      qs: {}
    }
  );
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// ------------------------------------- STANDUP -------------------------------------
export function requestStandupStartV1(token: string, channelId: number, length: number) {
  const res = request(
    'POST',
    SERVER_URL + '/standup/start/v1',
    {
      headers: {
        token,
      },
      json: {
        channelId,
        length
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestStandupSendV1(token: string, channelId: number, message: string) {
  const res = request(
    'POST',
    SERVER_URL + '/standup/send/v1',
    {
      headers: {
        token,
      },
      json: {
        channelId,
        message
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestStandupActiveV1(token:string, channelId: number) {
  const res = request(
    'GET',
    SERVER_URL + '/standup/active/v1',
    {
      headers: {
        token,
      },
      qs: {
        channelId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// ------------------------------------- ADMIN ---------------------------------------
export function requestAdminUserRemoveV1(token: string, uId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + '/admin/user/remove/v1',
    {
      headers: {
        token,
      },
      qs: {
        uId,
      }
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestAdminUserPermissionChangeV1(token: string, uId: number, permissionId: number) {
  const res = request(
    'POST',
    SERVER_URL + '/admin/userpermission/change/v1',
    {
      headers: {
        token,
      },
      json: {
        uId,
        permissionId,
      },
    });
  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- NOTIFICATIONS --------------------------------------
export function requestNotificationsGetV1(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/notifications/get/v1',
    {
      headers: {
        token,
      },
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- SEARCH --------------------------------------

export function requestSearchV1(token: string, queryStr: string) {
  const res = request(
    'GET',
    SERVER_URL + '/search/v1',
    {
      headers: {
        token,
      },
      qs: {
        queryStr,
      },
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

// -------------------------------------- STATS --------------------------------------

export function requestUserStatsV1(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/user/stats/v1',
    {
      headers: {
        token,
      },
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}

export function requestUsersStatsV1(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/users/stats/v1',
    {
      headers: {
        token,
      },
    });

  if (res.statusCode !== OK) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}
