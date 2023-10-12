const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { apiKeyTypes } = require('../config/apiKeys');

const apiKeySchema = mongoose.Schema(
  {
    apiKey: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [apiKeyTypes.AUTH],
      default: apiKeyTypes.AUTH,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
apiKeySchema.plugin(toJSON);

/**
 * @typedef Token
 */
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
