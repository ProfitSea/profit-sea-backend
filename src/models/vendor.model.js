const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { vendorNameEnums } = require('../utils/enums');

const vendorSchema = mongoose.Schema({
  name: {
    type: String,
    enum: vendorNameEnums,
    required: true,
  },
});

// Add plugin that converts mongoose to json
vendorSchema.plugin(toJSON);
vendorSchema.plugin(paginate);

/**
 * @typedef Vendor
 */
const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
