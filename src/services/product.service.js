/* eslint-disable no-console */
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const Products = require('../models/product.model');
const productSaleUnitService = require('./productSaleUnit.service');

/**
 * Get product by id
 * @param {ObjectId} productId
 * @returns {Promise<Product>}
 */
const getProductById = async (productId) => {
  return Product.findById(productId).populate({
    path: 'saleUnits',
  });
};

/**
 * Create a product
 * @param {Object} productBody
 * @returns {Promise<Product>}
 */
const createProduct = async (productBody) => {
  const existingProduct = await Product.findOne({
    productNumber: productBody.productNumber,
  }).populate({
    path: 'saleUnits',
  });

  if (existingProduct) {
    return existingProduct;
  }

  const session = await mongoose.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };
  let product;
  try {
    await session.withTransaction(async () => {
      const { prices: saleUnits, vendor, imgSrc, brand, description, productNumber, packSize } = productBody;

      const productId = mongoose.Types.ObjectId();

      let saleUnitsArray = saleUnits.map((su) => ({
        unit: su.unit,
        _id: mongoose.Types.ObjectId(),
      }));

      // Create saleUnits
      [saleUnitsArray] = await Promise.all([
        Promise.all(
          saleUnitsArray.map((saleUnit) =>
            productSaleUnitService.createProductSaleUnit(
              {
                ...saleUnit,
                product: productId,
              },
              session
            )
          )
        ),
      ]);
      product = new Products({
        saleUnits: saleUnitsArray,
        vendor,
        imgSrc,
        brand,
        description,
        productNumber,
        packSize,
        _id: productId,
      });
      await product.save({ session });
    }, transactionOptions);

    return getProductById(product._id);
  } catch (error) {
    console.error('Transaction Error: ', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Query for products
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProducts = async (filter, options) => {
  const products = await Product.paginate(filter, options);
  return products;
};

/**
 * Update product by id
 * @param {ObjectId} productId
 * @param {Object} updateBody
 * @returns {Promise<Product>}
 */
const updateProductById = async (productId, updateBody) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  Object.assign(product, updateBody);
  await product.save();
  return product;
};

/**
 * Delete product by id
 * @param {ObjectId} productId
 * @returns {Promise<Product>}
 */
const deleteProductById = async (productId) => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  await product.remove();
  return product;
};

module.exports = {
  createProduct,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
