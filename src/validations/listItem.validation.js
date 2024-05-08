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

const toggleListItemIsSelected = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    baseListItemId: Joi.string().custom(objectId).required(),
  }),
};

const toggleListItemIsRejected = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    baseListItemId: Joi.string().custom(objectId).required(),
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
    baseListItemId: Joi.string().custom(objectId).required(),
    comparisonListItemId: Joi.string().custom(objectId).required(),
  }),
};

const removeComparisonProduct = {
  params: Joi.object().keys({
    baseListItemId: Joi.string().custom(objectId).required(),
    comparisonListItemId: Joi.string().custom(objectId).required(),
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
  toggleListItemIsSelected,
  toggleListItemIsRejected,
};
