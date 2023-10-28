const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
      default: 'Untitled List',
    },
    listItems: {
      type: [
        {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'ListItem',
        },
      ],
      default: [],
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
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

// Pre-save hook to update itemsCount before saving
listSchema.pre('save', function (next) {
  this.itemsCount = this.listItems.length;
  next();
});

// Pre-updateOne hook to update itemsCount before updating
listSchema.pre('updateOne', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  this._update.itemsCount = docToUpdate.listItems.length;
  next();
});

const List = mongoose.model('List', listSchema);

module.exports = List;
