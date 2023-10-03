const Joi = require('joi');
const { objectId } = require('./custom.validation');

const priceValidation = Joi.object().keys({
  price: Joi.number().required(),
  unit: Joi.string().required(),
});

const createProduct = {
  body: Joi.object().keys({
    vendor: Joi.string().required(),
    imgSrc: Joi.string().required(),
    brand: Joi.string().required(),
    description: Joi.string().required(),
    productNumber: Joi.string().required(),
    packSize: Joi.string().required(),
    prices: Joi.array().items(priceValidation).required(),
    quantity: Joi.number().integer().default(0),
  }),
};

const getProducts = {
  query: Joi.object().keys({
    vendor: Joi.string(),
    brand: Joi.string(),
    description: Joi.string(),
    productNumber: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId), // You might also want to validate this using a custom objectId validation similar to the user.
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId), // Same as above regarding custom objectId validation.
  }),
  body: Joi.object()
    .keys({
      vendor: Joi.string(),
      imgSrc: Joi.string(),
      brand: Joi.string(),
      description: Joi.string(),
      productNumber: Joi.string(),
      packSize: Joi.string(),
      prices: Joi.array().items(priceValidation),
      quantity: Joi.number().integer(),
    })
    .min(1),
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId), // Again, you may want custom objectId validation.
  }),
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
