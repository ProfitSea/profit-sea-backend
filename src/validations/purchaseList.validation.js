const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createPurchaseList = {
  body: Joi.object().keys({
    name: Joi.string(),
    listId: Joi.string().custom(objectId),
  }),
};

const getPurchaseLists = {
  query: Joi.object().keys({
    sortBy: Joi.string().allow('').allow(null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPurchaseList = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId),
  }),
};

const updatePurchaseListName = {
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

const addPurchaseListItem = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    selectedListItemId: Joi.string().custom(objectId).required(),
    unselectedListItemId: Joi.string().custom(objectId).required(),
  }),
};

const removePurchaseListItem = {
  params: Joi.object().keys({
    purchaseListId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    listItemId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createPurchaseList,
  getPurchaseLists,
  getPurchaseList,
  updatePurchaseListName,
  deletePurchaseList,
  addPurchaseListItem,
  removePurchaseListItem,
};
