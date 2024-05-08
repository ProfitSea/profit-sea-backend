const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const purchaseListItemSchema = mongoose.Schema(
  {
    purchaseList: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'PurchaseList',
      required: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    listItem: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'ListItem',
      required: true,
    },
    unselectedListItem: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'ListItem',
      required: true,
    },
    priceAtOrder: {
      type: [
        {
          saleUnit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductSaleUnit',
            required: true,
          },
          price: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Price',
            required: true,
          },
          quantity: {
            type: Number,
            default: 1,
          },
        },
      ],
      default: [],
    },
    isAnchored: {
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
purchaseListItemSchema.plugin(toJSON);
purchaseListItemSchema.plugin(paginate);

const PurchaseListItem = mongoose.model('PurchaseListItem', purchaseListItemSchema);

module.exports = PurchaseListItem;
