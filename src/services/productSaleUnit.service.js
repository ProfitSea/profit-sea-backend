const httpStatus = require('http-status');
const { ProductSaleUnit } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a price
 * @param {Object} priceBody
 * @returns {Promise<ProductSaleUnit>}
 */
const createProductSaleUnit = async (body, session) => {
  const productSaleUnit = new ProductSaleUnit(body);
  if (session) {
    return productSaleUnit.save({ session });
  }
  return productSaleUnit.save();
};

/**
 * Query for prices
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProductSaleUnits = async (filter, options) => {
  const prices = await ProductSaleUnit.paginate(filter, options);
  return prices;
};

/**
 * Get price by id
 * @param {ObjectId} priceId
 * @returns {Promise<ProductSaleUnit>}
 */
const getProductSaleUnitById = async (priceId) => {
  return ProductSaleUnit.findById(priceId);
};

/**
 * Update price by id
 * @param {ObjectId} priceId
 * @param {Object} updateBody
 * @returns {Promise<ProductSaleUnit>}
 */
const updateProductSaleUnitById = async (priceId, updateBody) => {
  const price = await getProductSaleUnitById(priceId);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ProductSaleUnit not found');
  }
  Object.assign(price, updateBody);
  await price.save();
  return price;
};

/**
 * Delete price by id
 * @param {ObjectId} priceId
 * @returns {Promise<ProductSaleUnit>}
 */
const deleteProductSaleUnitById = async (priceId) => {
  const price = await getProductSaleUnitById(priceId);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ProductSaleUnit not found');
  }
  await price.remove();
  return price;
};

module.exports = {
  createProductSaleUnit,
  queryProductSaleUnits,
  getProductSaleUnitById,
  updateProductSaleUnitById,
  deleteProductSaleUnitById,
};
