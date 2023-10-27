/* eslint-disable no-console */
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const Products = require('../models/product.model');
const priceService = require('./price.service');
const productSaleUnitService = require('./productSaleUnit.service');

/**
 * Get product by id
 * @param {ObjectId} productId
 * @returns {Promise<Product>}
 */
const getProductById = async (productId) => {
  return Product.findById(productId).populate({
    path: 'saleUnits',
    populate: {
      path: 'price',
    },
  });
};

/**
 * Create a product
 * @param {Object} productBody
 * @returns {Promise<Product>}
 */
const createProduct = async (productBody) => {
  if (await Product.isProductNumberTaken(productBody.productNumber)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product with product number already exists');
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
      const { prices, vendor, imgSrc, brand, description, productNumber, packSize } = productBody;

      const productId = mongoose.Types.ObjectId();

      let saleUnits = prices.map((price) => ({
        unit: price.unit,
        _id: mongoose.Types.ObjectId(),
      }));

      let pricesObj = saleUnits.map((unit, index) => ({
        product: productId,
        productSaleUnit: unit._id,
        price: prices[index].price,
        _id: mongoose.Types.ObjectId(),
      }));

      // Create saleUnits and prices in parallel
      [pricesObj, saleUnits] = await Promise.all([
        Promise.all(pricesObj.map((price) => priceService.createPrice(price, session))),
        Promise.all(
          saleUnits.map((saleUnit, index) =>
            productSaleUnitService.createProductSaleUnit(
              {
                ...saleUnit,
                product: productId,
                price: pricesObj[index]._id,
              },
              session
            )
          )
        ),
      ]);
      product = new Products({
        saleUnits,
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
