const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getPurchaseListsItems = {
  query: Joi.object().keys({
    sortBy: Joi.string().allow('').allow(null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPurchaseListItemById = {
  params: Joi.object().keys({
    purchaseListItemId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  getPurchaseListsItems,
  getPurchaseListItemById,
};
