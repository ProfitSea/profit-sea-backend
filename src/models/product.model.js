const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    imgSrc: {
      type: String,
    },
    url: {
      type: String,
    },
    brand: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    productNumber: {
      type: String,
      required: true,
    },
    packSize: {
      type: String,
      required: true,
    },
    saleUnits: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'ProductSaleUnit',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
productSchema.plugin(toJSON);
productSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
productSchema.statics.isProductNumberTaken = async function (productNumber, excludeUserId) {
  const product = await this.findOne({ productNumber, _id: { $ne: excludeUserId } });
  return !!product;
};

const Products = mongoose.model('Products', productSchema);

module.exports = Products;
