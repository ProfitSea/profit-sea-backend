const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { PurchaseList } = require('../models');
const ApiError = require('../utils/ApiError');
const purchaseListItemService = require('./purchaseListItem.service');
const listItemService = require('./listItem.service');
const logger = require('../config/logger');

// const { updateProductById } = require('./product.service');

/**
 * Create a purchase list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const createPurchaseList = async (user, name, listId) => {
  return PurchaseList.create({
    name,
    user: user.id,
    list: listId,
  });
};

/**
 * Query for purchase lists
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryLists = async (filter, options) => {
  const lists = await PurchaseList.paginate(filter, options);
  return lists;
};

/**
 * Get list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const getPurchaseListById = async (listId) => {
  return PurchaseList.findById(listId).populate({
    path: 'purchaseListItems',
    populate: [
      {
        path: 'listItem',
        model: 'ListItem',
      },
    ],
  });
};

/**
 * Update list by id
 * @param {ObjectId} listId
 * @param {Object} updateBody
 * @returns {Promise<List>}
 */
const updatePurchaseListById = async (listId, updateBody) => {
  const list = await getPurchaseListById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }
  Object.assign(list, updateBody);
  await list.save();
  return list;
};

/**
 * Delete list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const deletePurchaseListById = async (listId) => {
  const list = await getPurchaseListById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }
  await list.remove();
  return list;
};

/**
 * Add product(listItem) in a purchase list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const addPurchaseListItem = async (user, purchaseListId, listItemId) => {
  const session = await mongoose.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };
  try {
    await session.withTransaction(async () => {
      const purchaseList = await getPurchaseListById(purchaseListId);
      if (purchaseList.user.toString() !== user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      const purchaseListItem = await purchaseListItemService.createPurchaseListItem(user, purchaseList.id, listItemId);

      if (!purchaseListItem) throw new ApiError(httpStatus.NOT_FOUND, 'Unable to add listItem to purchase list');

      const listItem = await listItemService.getListItemById(listItemId);
      purchaseList.totalAmount = purchaseList.totalAmount + listItem.totalPrice;
      purchaseList.purchaseListItems.unshift(purchaseListItem);
      purchaseList.itemsCount = purchaseList.purchaseListItems.length;
      await purchaseList.save();
      return purchaseListItem;
    }, transactionOptions);
  } catch (error) {
    logger.error('Transaction Error: ', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * delete product(listItem) in a purchase list
 * @param {Object} listItemId
 * @returns {Promise<List>}
 */
const removePurchaseListItem = async (user, purchaseListId, listItemId) => {
  const session = await mongoose.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };
  try {
    await session.withTransaction(async () => {
      const purchaseList = await getPurchaseListById(purchaseListId);

      if (!purchaseList) throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');
      if (purchaseList.user.toString() !== user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      const purchaseListItemId = await purchaseListItemService.removePurchaseListItemByListItemId(listItemId, user.id);
      purchaseList.purchaseListItems = purchaseList.purchaseListItems.filter(
        (listItem) => listItem._id.toString() !== purchaseListItemId
      );
      const listItem = await listItemService.getListItemById(listItemId);
      purchaseList.totalAmount = purchaseList.totalAmount - listItem.totalPrice;
      purchaseList.itemsCount = purchaseList.purchaseListItems.length;
      await purchaseList.save();
    }, transactionOptions);
  } catch (error) {
    logger.error('Transaction Error: ', error);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createPurchaseList,
  queryLists,
  getPurchaseListById,
  updatePurchaseListById,
  deletePurchaseListById,
  addPurchaseListItem,
  removePurchaseListItem,
};
