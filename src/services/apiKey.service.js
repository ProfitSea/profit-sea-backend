const bcrypt = require('bcryptjs');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const { apiKeyTypes } = require('../config/apiKeys');
const ApiKey = require('../models/apiKey.model');
const ApiError = require('../utils/ApiError');

/**
 * Generate apiKey
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateApiKey = (userId) => {
  return bcrypt.hash(`${userId}#${config.apiKey.secret}`, 10);
};

/**
 * Save a apiKey
 * @param {string} apiKey
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveApiKey = async (apiKey, userId, expires, type, blacklisted = false) => {
  const apiKeyDoc = await ApiKey.create({
    apiKey,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return apiKeyDoc;
};

/**
 * Verify apiKey and return apiKey doc (or throw an error if it is not valid)
 * @param {string} apiKey
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyApiKey = async (apiKey, type, userId) => {
  const apiKeyDoc = await config.apiKey.findOne({ apiKey, type, user: userId, blacklisted: false });
  if (!apiKeyDoc) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'API Key not found');
  }
  return apiKeyDoc;
};

/**
 * Generate auth apiKeys
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthApiKey = async (user) => {
  const apiKeyExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const apiKey = await generateApiKey(user.id, apiKeyExpires, apiKeyTypes.AUTH);

  return {
    apiKey,
  };
};

module.exports = {
  generateApiKey,
  saveApiKey,
  verifyApiKey,
  generateAuthApiKey,
};
