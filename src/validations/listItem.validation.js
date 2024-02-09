const Joi = require('joi');
const { objectId } = require('./custom.validation');

const addComparisonProduct = {
  params: Joi.object().keys({
    baseProductListItemId: Joi.string().custom(objectId),
    comparisonProductListItemId: Joi.string().custom(objectId).optional(),
  }),
};

const removeComparisonProduct = {
  params: Joi.object().keys({
    baseProductListItemId: Joi.string().custom(objectId),
    comparisonProductListItemId: Joi.string().custom(objectId).optional(),
  }),
};

const updateListItemQuantity = {
  body: Joi.object().keys({
    listItemId: Joi.string().custom(objectId).required(),
    saleUnitId: Joi.string().custom(objectId).required(),
    quantity: Joi.number().integer().required().greater(-1),
  }),
};

const updateListItemPrice = {
  body: Joi.object().keys({
    listItemId: Joi.string().custom(objectId).required(),
    prices: Joi.array()
      .items({
        saleUnitId: Joi.string().custom(objectId).required(),
        price: Joi.number().integer().required().greater(0),
      })
      .min(1),
  }),
};

module.exports = {
  addComparisonProduct,
  removeComparisonProduct,
  updateListItemQuantity,
  updateListItemPrice,
};
