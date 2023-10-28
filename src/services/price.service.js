const httpStatus = require('http-status');
const { Price } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a price
 * @param {Object} priceBody
 * @returns {Promise<Price>}
 */
const createPrice = async (body, session) => {
  const price = new Price(body);
  if (session) {
    return price.save({ session });
  }
  return price.save();
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
const queryPrices = async (filter, options) => {
  const prices = await Price.paginate(filter, options);
  return prices;
};

/**
 * Get price by id
 * @param {ObjectId} priceId
 * @returns {Promise<Price>}
 */
const getPriceById = async (priceId) => {
  return Price.findById(priceId);
};

/**
 * Update price by id
 * @param {ObjectId} priceId
 * @param {Object} updateBody
 * @returns {Promise<Price>}
 */
const updatePriceById = async (priceId, updateBody, session) => {
  const price = await getPriceById(priceId);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Price not found');
  }
  Object.assign(price, updateBody);

  if (session) {
    await price.save({ session });
    return price;
  }
  await price.save();
  return price;
};

/**
 * Delete price by id
 * @param {ObjectId} priceId
 * @returns {Promise<Price>}
 */
const deletePriceById = async (priceId) => {
  const price = await getPriceById(priceId);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Price not found');
  }
  await price.remove();
  return price;
};

module.exports = {
  createPrice,
  queryPrices,
  getPriceById,
  updatePriceById,
  deletePriceById,
};
