const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ListItem } = require('../models');
const ApiError = require('../utils/ApiError');
const productsService = require('./product.service');
const pricesService = require('./price.service');

/**
 * Get listItem by id
 * @param {ObjectId} listItemId
 * @returns {Promise<ListItem>}
 */
const getListItemById = async (listItemId) => {
  return ListItem.findById(listItemId).populate({
    path: 'product',
    populate: {
      path: 'saleUnits',
    },
  });
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

  if (updateResult.matchedCount === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found or Sale Unit not found in the list item');
  }
};

module.exports = {
  createListItem,
  queryListItems,
  getListItemById,
  updateListItemById,
  deleteListItemById,
  updateListItemQuantity,
};
