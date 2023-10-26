const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createList = {
  body: Joi.object().keys({}),
};

const getLists = {
  query: Joi.object().keys({
    sortBy: Joi.string().allow('').allow(null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getList = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId), // You might also want to validate this using a custom objectId validation similar to the user.
  }),
};

const updateList = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId), // Same as above regarding custom objectId validation.
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
    })
    .min(1),
};

const deleteList = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId), // Again, you may want custom objectId validation.
  }),
};

module.exports = {
  getLists,
  getList,
  updateList,
  deleteList,
  createList,
};
