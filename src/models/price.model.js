const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const priceSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Products',
      required: true,
    },
    productSaleUnit: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'ProductSaleUnit',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
priceSchema.plugin(toJSON);
priceSchema.plugin(paginate);

const Price = mongoose.model('Price', priceSchema);

module.exports = Price;
