const httpStatus = require('http-status');
const { Vendor } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a vendor
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createVendor = async (vendorBody) => {
  if (await Vendor.isVendorAdded(vendorBody.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Vendor.create(vendorBody);
};

module.exports = {
  createVendor,
};
