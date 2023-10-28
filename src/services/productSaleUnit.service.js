const httpStatus = require('http-status');
const { ProductSaleUnit } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a saleUnit
 * @param {Object} sale unit body
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
 * Query for saleUnits
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProductSaleUnits = async (filter, options) => {
  const saleUnits = await ProductSaleUnit.paginate(filter, options);
  return saleUnits;
};

/**
 * Get saleUnit by id
 * @param {ObjectId} saleUnitId
 * @returns {Promise<ProductSaleUnit>}
 */
const getProductSaleUnitById = async (saleUnitId) => {
  return ProductSaleUnit.findById(saleUnitId);
};

/**
 * Update saleUnit by id
 * @param {ObjectId} saleUnitId
 * @param {Object} updateBody
 * @returns {Promise<ProductSaleUnit>}
 */
const updateProductSaleUnitById = async (saleUnitId, updateBody, session) => {
  const saleUnit = await getProductSaleUnitById(saleUnitId);
  if (!saleUnit) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ProductSaleUnit not found');
  }

  Object.assign(saleUnit, updateBody);

  if (session) {
    await saleUnit.save({ session });
    return saleUnit;
  }

  await saleUnit.save();
  return saleUnit;
};

/**
 * Delete sale unit by id
 * @param {ObjectId} saleUnitId
 * @returns {Promise<ProductSaleUnit>}
 */
const deleteProductSaleUnitById = async (saleUnitId) => {
  const saleUnit = await getProductSaleUnitById(saleUnitId);
  if (!saleUnit) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ProductSaleUnit not found');
  }
  await saleUnit.remove();
  return saleUnit;
};

module.exports = {
  createProductSaleUnit,
  queryProductSaleUnits,
  getProductSaleUnitById,
  updateProductSaleUnitById,
  deleteProductSaleUnitById,
};
