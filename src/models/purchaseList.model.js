const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const purchaseListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
      default: 'Untitled Purchase List',
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    purchaseListItems: {
      type: [
        {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'PurchaseListItem',
        },
      ],
      default: [],
    },
    list: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'List',
      required: true,
    },
    itemsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
purchaseListSchema.plugin(toJSON);
purchaseListSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} name - The user's name
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
purchaseListSchema.statics.isNameTaken = async function (name, excludeUserId) {
  const listbuilder = await this.findOne({ name, _id: { $ne: excludeUserId } });
  return !!listbuilder;
};

// Pre-save hook to update itemsCount before saving
purchaseListSchema.pre('save', function (next) {
  this.itemsCount = this.purchaseListItems.length;
  next();
});

// Pre-updateOne hook to update itemsCount before updating
purchaseListSchema.pre('updateOne', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  this._update.itemsCount = docToUpdate.purchaseListItems.length;
  next();
});

const PurchaseList = mongoose.model('PurchaseList', purchaseListSchema);

module.exports = PurchaseList;
