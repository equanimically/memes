import {
  getData,
  setData,
} from './dataStore';
import {
  isUserIdValid,
  getUidFromToken,
} from './other';
import {
  checkFirstName,
  checkLastName,
} from './auth';
import IsEmail from 'isemail';
import {
  FORBIDDEN,
  UserProfiles,
  BAD_REQUEST,
  BOT,
} from './interface';
import HTTPError from 'http-errors';
import config from './config.json';

/**
 * The return interface for userProfileV3
 * @interface userProfileReturn
 * @property {Object} user - Object containing user details
 * @property {number} user.uId - The user ID of the user
 * @property {string} user.email - The email of the user
 * @property {string} user.nameFirst - The first name of the user
 * @property {string} user.nameLast - The last name of the user
 * @property {string} user.handleStr - The handle string of the user
 */
interface userProfileReturn {
  user: {
    uId: number;
    email: string;
    nameFirst: string;
    nameLast: string;
    handleStr: string;
    profileImgUrl: string;
  };
}

/**
 * given auth user id and some user id, return the following details: uid, email, first name, last name and handle string.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {number} uId - an integer to identify a user
 *
 * @returns {{error: 'error'}} - Object containing error message if authUserId invalid or uId doesnt exist
 * @returns {{}} - Empty object if successful
 */

export function userProfileV3(token: string, uId: number): userProfileReturn {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (!isUserIdValid(uId) && uId !== BOT) {
    throw HTTPError(BAD_REQUEST, 'uId does not refer to a valid user');
  }
  let email, nameFirst, nameLast, handleStr, profileImgUrl;
  if (uId === BOT) {
    const bot = data.bots.find(bot => bot.uId === BOT);
    email = bot.email;
    nameFirst = bot.nameFirst;
    nameLast = bot.nameLast;
    handleStr = bot.handleStr;
    profileImgUrl = bot.profileImgUrl;
  } else {
    const user = data.users.find(user => user.uId === uId);
    email = user.email;
    nameFirst = user.nameFirst;
    nameLast = user.nameLast;
    handleStr = user.handleStr;
    profileImgUrl = user.profileImgUrl;
  }

  setData(data);
  return { user: { uId, email, nameFirst, nameLast, handleStr, profileImgUrl } };
}

/**
 * given a valid token, return all users stored in the data.
 *
 * @param {string} token - The token of the authenticated user.
 *
 * @returns {{error: string}} - if token is invalid
 * @returns {{users: userProfileReturn[]}} - if token is valid
 */
export function usersAllV2(token: string): UserProfiles {
  const uId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(uId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  const users = [];
  const data = getData();
  for (const user of data.users) {
    if (!user.isRemoved) {
      users.push({
        uId: user.uId,
        email: user.email,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        handleStr: user.handleStr,
        profileImgUrl: user.profileImgUrl,
      });
    }
  }
  setData(data);

  return { users: users };
}

/**
 * given a valid token, change the first name and last name of the user.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {string} nameFirst - the first name of the authenticated user
 * @param {string} nameLast - the last name of the authenticated user
 *
 * @returns {{}} - If successful, returns an empty object
 */
export function userProfileSetNameV2(token: string, nameFirst: string, nameLast: string): Record<never, never> {
  const data = getData();
  const uId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(uId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (!checkFirstName(nameFirst)) {
    throw HTTPError(BAD_REQUEST, 'Invalid first name');
  }
  if (!checkLastName(nameLast)) {
    throw HTTPError(BAD_REQUEST, 'Invalid last name');
  }

  const user = data.users.find(user => user.uId === uId);

  user.nameFirst = nameFirst;
  user.nameLast = nameLast;

  setData(data);
  return {};
}

/**
 * given a valid token, change the email of the user
 *
 * @param {string} token - The token of the authenticated user.
 * @param {string} email - the email of the authenticated user
 *
 * @returns {{}} - If successful, returns an empty object
 */
export function userProfileSetEmailV2(token: string, email: string): Record<never, never> {
  const data = getData();
  const uId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(uId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (IsEmail.validate(email) !== true) {
    throw HTTPError(BAD_REQUEST, 'Invalid email');
  }
  if (data.users.some(user => user.email === email)) {
    throw HTTPError(BAD_REQUEST, 'Email already in use');
  }

  const user = data.users.find(user => user.uId === uId);

  user.email = email;

  setData(data);
  return {};
}

/**
 * given a valid token, change the handle of the user
 *
 * @param {string} token - The token of the authenticated user.
 * @param {string} handleStr - the handle of the authenticated user
 *
 * @returns {{}} - If successful, returns an empty object
 */
export function userProfileSetHandleV2(token: string, handleStr: string): Record<never, never> {
  const data = getData();
  const uId = getUidFromToken(token);

  // Error checking
  if (handleStr.length < 3 || handleStr.length > 20) {
    throw HTTPError(BAD_REQUEST, 'Invalid handle');
  }
  if (!handleStr.match(/^\w+$/)) {
    throw HTTPError(BAD_REQUEST, 'Invalid handle');
  }
  if (!isUserIdValid(uId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (data.users.some(user => user.handleStr === handleStr)) {
    throw HTTPError(BAD_REQUEST, 'Handle already in use');
  }

  const user = data.users.find(user => user.uId === uId);

  user.handleStr = handleStr;

  setData(data);
  return {};
}

/**
 * Sets the profile image URL for the authenticated user after cropping it to the specified dimensions.
 *
 * @param {string} token - The token of the authenticated user.
 * @param {string} imgUrl - The URL of the image to be set as the profile picture.
 * @param {number} xStart - The x-coordinate of the starting point of the crop area.
 * @param {number} yStart - The y-coordinate of the starting point of the crop area.
 * @param {number} xEnd - The x-coordinate of the ending point of the crop area.
 * @param {number} yEnd - The y-coordinate of the ending point of the crop area.
 *
 * @returns {Promise<void>} - If successful, returns a promise that resolves to an empty object.
 */
export async function userProfileSetProfileImgUrlV1(token: string, imgUrl: string, xStart:number, yStart:number, xEnd:number, yEnd:number) {
  const data = getData();
  const uId = getUidFromToken(token);
  if (checkURL(imgUrl) === false) {
    throw HTTPError(BAD_REQUEST, 'Invalid image');
  }
  if (!isUserIdValid(uId)) {
    throw HTTPError(FORBIDDEN, 'Unauthorized user');
  }
  if (xEnd < xStart || yEnd < yStart) {
    throw HTTPError(BAD_REQUEST, 'Invalid dimension');
  }
  const PORT: number = parseInt(process.env.PORT || config.port);
  const HOST: string = process.env.IP || 'localhost';
  const download = require('image-downloader');
  const options = {
    url: imgUrl,
    dest: `../../img/${uId}.jpg`,
  };
  await download.image(options);
  const sizeOf = require('image-size');
  const dimensions = sizeOf(`img/${uId}.jpg`);

  if (xStart > dimensions.width ||
    yStart > dimensions.height ||
    xEnd > dimensions.width ||
    yEnd > dimensions.height ||
    xStart < 0 ||
    yStart < 0 ||
    xEnd <= xStart ||
    yEnd <= yStart) {
    throw HTTPError(BAD_REQUEST, 'Invalid dimension');
  }

  const Jimp = require('jimp');
  const image = Jimp.read(imgUrl);
  image.then((img: any) => {
    img
      .crop(xStart, yStart, xEnd - xStart, yEnd - yStart)
      .write(`./img/cropped${uId}.jpg`);
  });

  const user = data.users.find(user => user.uId === uId);
  user.profileImgUrl = `http://${HOST}:${PORT}/img/cropped${uId}.jpg`;
  setData(data);
  return {};
}
function checkURL(url:string) {
  return (url.match(/\.(jpeg|jpg)$/) != null);
}
