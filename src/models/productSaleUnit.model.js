const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const productSaleUnitSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Products',
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
productSaleUnitSchema.plugin(toJSON);
productSaleUnitSchema.plugin(paginate);

const ProductSaleUnit = mongoose.model('ProductSaleUnit', productSaleUnitSchema);

module.exports = ProductSaleUnit;
