const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const vendorSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Add plugin that converts mongoose to json
vendorSchema.plugin(toJSON);
vendorSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
vendorSchema.statics.isVendorAdded = async function (name, excludeUserId) {
  const vendor = await this.findOne({ name, _id: { $ne: excludeUserId } });
  return !!vendor;
};

/**
 * @typedef Vendor
 */
const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
