// All authentication related function will be under this folder
import IsEmail from 'isemail';
import {
  v4 as uuidV4
} from 'uuid';
import {
  getData,
  setData,
} from './dataStore';
import {
  getTime,
  getUidFromToken,
  isUserIdValid,
} from './other';
import {
  User,
  BAD_REQUEST,
  FORBIDDEN,
  K_24,
  HOST,
  PORT,
} from './interface';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import HTTPError from 'http-errors';

/**
 * Validates if a password has an acceptable length.
 *
 * @param {string} password - The password to be validated.
 * ...
 *
 * @returns {boolean} - Returns true if the password is valid
 * @returns {{error: string}} - if password is invalid
 */
function checkPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validates if a first name has an acceptable length.
 *
 * @param {string} nameFirst - The first name to be validated.
 * ...
 *
 * @returns {boolean} - Returns true if the first name is valid
 * @returns {{error: string}} - if first name is invalid length
 */
export function checkFirstName(nameFirst: string): boolean {
  return !(nameFirst.length < 1 || nameFirst.length > 50);
}

/**
 * Validates if a last name has an acceptable length.
 *
 * @param {string} nameLast - The last name to be validated.
 * ...
 *
 * @returns {boolean} - Returns true if the last name is valid
 * @returns {{error: string}} - if last name is invalid length
 */
export function checkLastName(nameLast: string): boolean {
  return !(nameLast.length < 1 || nameLast.length > 50);
}

/**
 * Generates a unique handle string by appending a number to the
 * original handle string if the original is already in use by another user.
 *
 * @param {string} handleStr - The handle string to be checked and modified if necessary.
 * ...
 *
 * @returns {string} - Returns the modified handle string that is unique and
 * not already in use by another user.
 */
export function checkHandle(handleStr: string): string {
  const data = getData();

  let newHandleStr = handleStr;
  let handleCount = 0;

  while (data.users.some(user => user.handleStr === newHandleStr)) {
    newHandleStr = handleStr + handleCount;
    handleCount++;
  }
  return newHandleStr;
}

/**
 *  The return object of authLoginV2 and authRegisterV3 function
 *
 *  @param {number} authUserId - The unique ID of the user.
 *  @param {string} token - The unique token of the user.
 */
interface authReturn {
  authUserId: number;
  token: string;
}

/**
 * Authenticates a user's login information by verifying if the provided email
 * and password belong to a registered user, and returns their unique
 * authUserId if the information is correct.
 *
 * @param {string} email - The email address associated with the user account.
 * @param unencryptedPassword
 * ...
 *
 * @returns {{authUserId: number}} - If authentication was successful
 * @returns {{error: 'error'}} - If authentication was unsuccessful
 */
export function authLoginV3(email: string, unencryptedPassword: string): authReturn {
  const data = getData();
  // Convert password to sha256
  const password = Base64.stringify(sha256(unencryptedPassword));
  // Error checking
  for (const element of data.users) {
    if (element.email === email && element.password === password) {
      const authUserId = element.authUserId;

      // Generate a unique token using uuidV4
      const unencryptedToken = uuidV4();
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(unencryptedToken, 'peeposad');

      // Add the token to the user's token array
      element.token.push(token);

      setData(data);
      return {
        authUserId,
        token
      };
    }
  }

  throw HTTPError(BAD_REQUEST, 'Invalid email or password');
}

/**
 * Creates a new user account with the provided registration information
 * and returns a unique authUserId for the new account.
 * The function generates a unique handle for each registered user
 * based on their first and last name.
 *
 * @param {string} email - The email address to be associated with the new account.
 * @param {string} password - The password to be associated with the new account.
 * @param {string} nameFirst - The first name of the user to be registered.
 * @param {string} nameLast - The last name of the user to be registered.
 * ...
 *
 * @returns {{authUserId}} - An object containing the new user's authUserId if registration is successful.
 */
export function authRegisterV3(email: string, unencryptedPassword: string, nameFirst: string, nameLast: string): authReturn {
  const data = getData();
  // Error checking
  if (!IsEmail.validate(email)) throw HTTPError(BAD_REQUEST, 'Invalid email');
  if (data.users.some(user => user.email === email)) throw HTTPError(BAD_REQUEST, 'Email already in use');
  if (!checkPassword(unencryptedPassword)) throw HTTPError(BAD_REQUEST, 'Invalid password');
  if (!checkFirstName(nameFirst)) throw HTTPError(BAD_REQUEST, 'Invalid first name');
  if (!checkLastName(nameLast)) throw HTTPError(BAD_REQUEST, 'Invalid last name');

  // Generate handleStr
  let handleStr = (nameFirst + nameLast).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 20);
  handleStr = checkHandle(handleStr);

  // Encryption
  const jwt = require('jsonwebtoken');
  const authUserId = data.users.length;
  const uId = authUserId;
  const password = Base64.stringify(sha256(unencryptedPassword));

  // Add new user
  const userPermissions = authUserId === 0 ? 1 : 2;

  // Add K-24 bot for the first time
  if (authUserId === 0) {
    data.bots.push(K_24);
  }

  // Return auth info
  const unencryptedToken = (authUserId === 0) ? '0' : authUserId.toString();
  const token = jwt.sign(unencryptedToken, 'peeposad');
  const newUser: User = {
    authUserId,
    uId,
    email,
    password,
    nameFirst,
    nameLast,
    handleStr,
    userPermissions,
    token: [], // Initialize token as an empty array
    profileImgUrl: `http://${HOST}:${PORT}/img/default.jpg`,
    resetPasswordToken: undefined,
    isRemoved: false,
    notifications: [],
    userStats: {
      channelsJoined: [
        {
          numChannelsJoined: 0,
          timeStamp: getTime(),
        }
      ],
      dmsJoined: [
        {
          numDmsJoined: 0,
          timeStamp: getTime(),
        }
      ],
      messagesSent: [
        {
          numMessagesSent: 0,
          timeStamp: getTime(),
        }
      ],
      involvementRate: 0
    }
  };
  newUser.token.push(token); // Add the generated token to the user's token array
  data.users.push(newUser);
  setData(data);
  return { authUserId, token };
}

/**
 * Logs a user out of their account by invalidating their token and removing it from their profile.
 *
 * @param {string} token - The token associated with the user account.
 *
 * @returns {} - Returns an empty object if logout was successful
 */
export function authLogoutV2(token: string): Record<never, never> {
  const data = getData();
  const authUserId = getUidFromToken(token);

  // Error checking
  if (!isUserIdValid(authUserId)) {
    throw HTTPError(FORBIDDEN, 'Invalid token');
  }

  const user = data.users.find(user => user.authUserId === authUserId);

  // Invalidate the user's token by removing it from their profile
  user.token = user.token.filter(t => t !== token);

  setData(data);
  return {};
}

/**
 * Sends a password reset request email to the specified email address.
 *
 * @param {string} email - The email address associated with the user account.
 *
 * @returns {} - Returns an empty object if the reset request was successful.
 */
export function authPasswordResetRequestV1(email: string) {
  const data = getData();
  // checks if email is in the database
  if (!data.users.some(user => user.email === email)) {
    throw HTTPError(BAD_REQUEST, 'Email not found');
  }
  // get uid with email
  const uid = data.users.find(user => user.email === email).authUserId;
  // generates a random token
  const passwordResetToken = uuidV4();
  data.users[uid].resetPasswordToken = passwordResetToken;
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'marcellus.powlowski@ethereal.email',
      pass: 'xzNQqpZaVxPFXJq5T4'
    }
  });

  // Define email options
  const mailOptions = {
    from: 'marcellus.powlowski@ethereal.email',
    to: email,
    subject: 'Password Reset Request',
    text: `Please use the following token to reset your password: ${passwordResetToken}`,
  };

  // Send email
  transporter.sendMail(mailOptions);
  setData(data);
  return {};
}

/**
 * Resets a user's password using the provided password reset code and new password.
 * If the reset code is valid and matches the stored reset code in the user's profile,
 * the user's password will be updated with the new password provided.
 *
 * @param {string} resetCode - The password reset code sent to the user's email.
 * @param {string} newPassword - The new password to be set for the user account.
 *
 * @returns {} - Returns an empty object if the password reset was successful.
 */
export function authPasswordResetResetV1(resetCode: string, newPassword: string): Record<never, never> {
  const data = getData();
  // Check if resetCode is a valid reset code
  const uid = data.users.findIndex(user => user.resetPasswordToken === resetCode);
  if (uid === -1) {
    throw HTTPError(BAD_REQUEST, 'Invalid reset code');
  }

  // Check if newPassword is at least 6 characters long
  if (newPassword.length < 6) {
    throw HTTPError(BAD_REQUEST, 'New password must be at least 6 characters long');
  }

  // Hash and encode the new password
  const passwordHash = Base64.stringify(sha256(newPassword));

  // Update user's password hash and invalidate reset code
  data.users[uid].password = passwordHash;
  data.users[uid].resetPasswordToken = null;

  setData(data);
  return {};
}
// End of file
