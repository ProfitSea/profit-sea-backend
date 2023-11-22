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
 * Update product price
 * @param {ObjectId} productId
 * @returns {Promise<Product>}
 */
// const updateProductsPrice = async (existingProduct, updatedPrices) => {
//   // Create a map for quick lookup
//   const existingUnitsMap = Object.fromEntries(existingProduct.saleUnits.map((unit) => [unit.unit, unit]));

//   // // Validate if all units in updatedPrices exist in the existing product
//   // const allUnitsExist = updatedPrices.every(({ unit }) => unit in existingUnitsMap);

//   // if (!allUnitsExist) {
//   //   throw new ApiError(httpStatus.BAD_REQUEST, 'One or more units in the price array do not exist');
//   // }

//   const session = await mongoose.startSession();
//   const transactionOptions = {
//     readPreference: 'primary',
//     readConcern: { level: 'local' },
//     writeConcern: { w: 'majority' },
//   };

//   try {
//     await session.withTransaction(async () => {
//       const deactivationPromises = updatedPrices
//         .map((updatedPrice) => {
//           const existingSaleUnit = existingUnitsMap[updatedPrice.unit];
//           if (existingSaleUnit && existingSaleUnit.price.price !== updatedPrice.price) {
//             return priceService.updatePriceById(existingSaleUnit.price._id, { active: false }, session);
//           }
//           return Promise.resolve();
//         })
//         .filter(Boolean);

//       const newPricePromises = updatedPrices
//         .map((updatedPrice) => {
//           const existingSaleUnit = existingUnitsMap[updatedPrice.unit];
//           if (existingSaleUnit && existingSaleUnit.price.price !== updatedPrice.price) {
//             return priceService.createPrice(
//               {
//                 product: existingProduct._id,
//                 productSaleUnit: existingSaleUnit._id,
//                 price: updatedPrice.price,
//               },
//               session
//             );
//           }
//           return Promise.resolve();
//         })
//         .filter(Boolean);

//       const newPrices = await Promise.all(newPricePromises);

//       const updateSaleUnitPromises = newPrices
//         .map((newPrice, index) => {
//           const existingSaleUnit = existingUnitsMap[updatedPrices[index].unit];
//           if (existingSaleUnit && existingSaleUnit.price.price !== updatedPrices[index].price) {
//             return productSaleUnitService.updateProductSaleUnitById(existingSaleUnit._id, { price: newPrice._id }, session);
//           }
//           return Promise.resolve();
//         })
//         .filter(Boolean);

//       // Await all deactivations and updates
//       await Promise.all(deactivationPromises);
//       await Promise.all(updateSaleUnitPromises);
//     }, transactionOptions);

//     return getProductById(existingProduct._id);
//   } catch (error) {
//     console.error('Transaction Error: ', error);
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };

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
