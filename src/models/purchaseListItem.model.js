const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const purchaseListItemSchema = mongoose.Schema(
  {
    purchaselist: {
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
            default: 0,
          },
        },
      ],
      default: [],
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
