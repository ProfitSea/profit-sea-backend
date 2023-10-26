const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    default: 'Untitled List',
  },
  products: {
    type: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Products',
      },
    ],
    default: [],
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
  productsCount: {
    type: Number,
    default: 0,
  },
});

// add plugin that converts mongoose to json
listSchema.plugin(toJSON);
listSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} name - The user's name
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
listSchema.statics.isNameTaken = async function (name, excludeUserId) {
  const listbuilder = await this.findOne({ name, _id: { $ne: excludeUserId } });
  return !!listbuilder;
};

// Pre-save hook to update productsCount before saving
listSchema.pre('save', function (next) {
  this.productsCount = this.products.length;
  next();
});

// Pre-updateOne hook to update productsCount before updating
listSchema.pre('updateOne', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  this._update.productsCount = docToUpdate.products.length;
  next();
});

const List = mongoose.model('List', listSchema);

module.exports = List;
