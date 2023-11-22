const Joi = require('joi');
const { objectId } = require('./custom.validation');

const updateListItemQuantity = {
  body: Joi.object().keys({
    listItemId: Joi.string().custom(objectId).required(),
    saleUnitId: Joi.string().custom(objectId).required(),
    quantity: Joi.number().integer().required().greater(0),
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
  updateListItemQuantity,
  updateListItemPrice,
};
