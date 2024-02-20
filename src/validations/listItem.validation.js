const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { priceValidation } = require('./product.validation');

const getListItem = {
  query: {
    productNumber: Joi.string().required(),
  },
};

const getListItemById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const toggleListItemAnchor = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateListItemPricesByProductNumber = {
  query: {
    productNumber: Joi.string().required(),
  },
  body: {
    prices: Joi.array().items(priceValidation).required(),
  },
};

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
    prices: Joi.array().items(priceValidation).required(),
  }),
};

module.exports = {
  addComparisonProduct,
  removeComparisonProduct,
  updateListItemQuantity,
  updateListItemPrice,
  getListItem,
  updateListItemPricesByProductNumber,
  getListItemById,
  toggleListItemAnchor,
};
