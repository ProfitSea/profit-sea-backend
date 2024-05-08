const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const listItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Products',
      required: true,
    },
    isBaseProduct: {
      type: Boolean,
      required: true,
      default: false,
    },
    comparisonProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ListItem',
      },
    ],
    vendor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vendor',
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
          default: 1,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
    isAnchored: {
      type: Boolean,
      default: false,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    isRejected: {
      type: Boolean,
      default: false,
    },
    recommendation: {
      listItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ListItem',
      },
      priceSaving: {
        type: String,
      },
      reason: {
        type: String,
        maxlength: 300,
      },
    },
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
