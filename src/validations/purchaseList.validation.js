const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { productSchema } = require('./product.validation');

const createPurchaseList = {
  body: Joi.object().keys({
    name: Joi.string(),
    listId: Joi.string().custom(objectId),
  }),
};

const getPurchaseList = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId),
  }),
};

const updatePurchaseList = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
    })
    .min(1),
};

const deletePurchaseList = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId),
  }),
};

const updatePurchaseListName = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
    })
    .min(1),
};

const addPurchaseListItem = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      product: productSchema,
    })
    .min(1),
};

const removePurchaseListItem = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId).required(),
    purchaseListItemId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  getPurchaseList,
  updatePurchaseList,
  deletePurchaseList,
  createPurchaseList,
  updatePurchaseListName,
  addPurchaseListItem,
  removePurchaseListItem,
};
