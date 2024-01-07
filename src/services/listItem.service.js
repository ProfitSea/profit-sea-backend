const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ListItem } = require('../models');
const ApiError = require('../utils/ApiError');
const productsService = require('./product.service');
const pricesService = require('./price.service');
const logger = require('../config/logger');

/**
 * Get listItem by id
 * @param {ObjectId} listItemId
 * @returns {Promise<ListItem>}
 */
const getListItemById = async (listItemId) => {
  return ListItem.findById(listItemId).populate([
    {
      path: 'product',
    },
    {
      path: 'saleUnitQuantities.saleUnit',
      model: 'ProductSaleUnit', // Replace with the correct model name for sale units
    },
    {
      path: 'saleUnitQuantities.price',
      model: 'Price', // Replace with the correct model name for price
    },
  ]);
};

/**
 * Create a listItem
 * @param {Object} listBody
 * @returns {Promise<ListItem>}
 */
const createListItem = async (user, listId, product) => {
  const productObj = await productsService.createProduct(product);
  if (!productObj) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  const existingListItem = await ListItem.findOne({
    user: user.id,
    list: listId,
    product: productObj.id,
  });

  if (existingListItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product already in list');
  }

  const { prices } = product;

  const listItemId = mongoose.Types.ObjectId();

  const saleUnitQuantitiePromises = productObj.saleUnits.map(async (saleUnit) => {
    const priceObj = prices.find((price) => price.unit === saleUnit.unit);
    if (priceObj) {
      const price = await pricesService.createPrice({
        productSaleUnit: saleUnit.id,
        price: priceObj.price,
        listItem: listItemId,
        user: user.id,
      });
      return {
        saleUnit: saleUnit.id,
        quantity: 0,
        price,
      };
    }
    return false;
  });

  const saleUnitQuantities = await Promise.all(saleUnitQuantitiePromises);

  const listItemPayload = {
    user: user.id,
    list: listId,
    product: productObj,
    saleUnitQuantities,
    vendor: productObj.vendor,
  };

  const listItem = new ListItem(listItemPayload);
  await listItem.save();

  return getListItemById(listItem.id);
};

/**
 * Query for lists
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryListItems = async (filter, options) => {
  const listItems = await ListItem.paginate(filter, options);
  return listItems;
};

/**
 * Update list by id
 * @param {ObjectId} listId
 * @param {Object} updateBody
 * @returns {Promise<ListItem>}
 */
const updateListItemById = async (listItemId, updateBody) => {
  const listItem = await getListItemById(listItemId);
  if (!listItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }
  Object.assign(listItem, updateBody);
  await listItem.save();
  return listItem;
};

/**
 * Delete list by id
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const deleteListItemById = async (listItemId, userId) => {
  const listItem = await ListItem.findOne({ _id: listItemId, user: userId });
  if (!listItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }
  await listItem.remove();
};

const updateListItemQuantity = async (user, listItemId, saleUnitId, quantity) => {
  const updateResult = await ListItem.updateOne(
    {
      _id: listItemId,
      user: user.id,
      'saleUnitQuantities.saleUnit': saleUnitId,
    },
    {
      $set: { 'saleUnitQuantities.$.quantity': quantity },
    }
  );

  if (updateResult.nModified === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found or Sale Unit not found in the list item');
  }

  // Recalculate the total price
  const listItem = await ListItem.findById(listItemId).populate('saleUnitQuantities.price');
  let totalPrice = 0;
  listItem.saleUnitQuantities.forEach((suq) => {
    const priceData = suq.price || {}; // Fallback to an empty object if price is not populated
    totalPrice += suq.quantity * (priceData.price || 0);
  });

  listItem.totalPrice = Math.round(totalPrice * 100) / 100;
  await listItem.save();
};

/**
 * Update ListItem price
 * @param {ObjectId} listItemId
 * @param {Array} prices
 * @returns {Promise<Product>}
 */
const updateListItemPrice = async (user, listItemId, prices) => {
  const listItem = await getListItemById(listItemId);
  if (!listItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }

  const session = await mongoose.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };

  try {
    await session.withTransaction(async () => {
      // Create new prices and update listItem in parallel
      const updatePromises = prices.map(async (update) => {
        const { saleUnitId, price } = update;

        const saleUnitQuantity = listItem.saleUnitQuantities.find((suq) => suq.saleUnit.id.toString() === saleUnitId);

        if (!saleUnitQuantity) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Sale Unit not found in the list item');
        }

        const newPrice = await pricesService.createPrice(
          {
            productSaleUnit: saleUnitId,
            listItem: listItemId,
            user: listItem.user,
            price,
            active: true,
          },
          session
        );

        saleUnitQuantity.price = newPrice._id;

        // Deactivate old prices
        await pricesService.deactivatePricesByListItemId(listItemId, saleUnitId, newPrice._id, session);
      });

      await Promise.all(updatePromises);

      await listItem.save({ session });
    }, transactionOptions);

    return getListItemById(listItemId);
  } catch (error) {
    logger.error('Transaction Error: ', error);
    throw error;
  } finally {
    session.endSession();
  }
};

const findListItemByProductNumber = async (user, { productNumber }) => {
  const result = await ListItem.aggregate([
    // Lookup to join with the Products collection
    {
      $lookup: {
        from: 'products', // the collection to join
        localField: 'product', // field from the ListItem collection
        foreignField: '_id', // field from the Products collection
        as: 'product', // the array to put the joined documents
      },
    },
    // Match the user's ID in the ListItem collection
    {
      $match: {
        user: user._id,
        'product.productNumber': `#${productNumber}`,
      },
    },
    // Unwind the product array to deconstruct the array
    {
      $unwind: '$product',
    },
  ]);
  const listItem = result[0] || null;

  if (!listItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }

  return listItem;
};

module.exports = {
  createListItem,
  queryListItems,
  getListItemById,
  updateListItemById,
  deleteListItemById,
  updateListItemQuantity,
  updateListItemPrice,
  findListItemByProductNumber,
};
