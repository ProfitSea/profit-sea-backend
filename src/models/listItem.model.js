const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const listItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Products',
      required: true,
    },
    vendor: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    list: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'List',
      required: true,
    },
    saleUnitQuantities: [
      {
        saleUnit: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'ProductSaleUnit',
          required: true,
        },
        price: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Price',
          required: true,
        },
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
listItemSchema.plugin(toJSON);
listItemSchema.plugin(paginate);

const ListItem = mongoose.model('ListItem', listItemSchema);

module.exports = ListItem;
