const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { PurchaseList } = require('../models');
const ApiError = require('../utils/ApiError');
const { subtractWithFixed, sumWithFixed } = require('../utils/helper');
const purchaseListItemService = require('./purchaseListItem.service');
const listItemService = require('./listItem.service');
const logger = require('../config/logger');
const { listService } = require('../services');

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

const getPurchaseListWithPriceSaving = async (user, listId) => {
  const listObjectId = mongoose.Types.ObjectId(listId);

  let purchaseList = await PurchaseList.findOne({ list: listObjectId }).populate({
    path: 'purchaseListItems',
    populate: [
      {
        path: 'listItem',
        model: 'ListItem',
        populate: [
          {
            path: 'comparisonProducts',
          },
        ],
      },
    ],
  });
  if (!purchaseList) {
    const list = await listService.getListById(listId);
    if (!list) {
      throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
    }
    // create a purchase list
    purchaseList = await PurchaseList.create({
      name: list.name,
      user: user.id,
      list: listId,
    });
  }

  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase List not found');
  }
  // return purchaseList;
  purchaseList.priceSaving = subtractWithFixed(purchaseList.unselectedTotalAmount, purchaseList.totalAmount);

  purchaseList.additionalCost.forEach((vendor) => {
    vendor.priceSaving = subtractWithFixed(vendor.totalAmount, purchaseList.totalAmount);
  });

  await purchaseList.save();
  return purchaseList;
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
        populate: [
          {
            path: 'comparisonProducts',
          },
        ],
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

// Utility function for starting a session with transaction options
const startTransactionSession = async () => {
  const session = await mongoose.startSession();
  return {
    session,
    transactionOptions: { readPreference: 'primary', readConcern: { level: 'local' }, writeConcern: { w: 'majority' } },
  };
};

// Utility function to update additional costs in a purchase list
const updateAdditionalCosts = async (purchaseList, listItem, amount) => {
  const existingVendor = purchaseList.additionalCost.find((vendor) => vendor.vendor.equals(listItem.vendor));

  if (existingVendor) {
    existingVendor.totalAmount = sumWithFixed(existingVendor.totalAmount, amount);
    await existingVendor.save();
  } else {
    purchaseList.additionalCost.push({ vendor: listItem.vendor, totalAmount: amount });
  }
};

/**
 * Add product(listItem) in a purchase list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const addPurchaseListItem = async (user, purchaseListId, selectedListItemId, unselectedListItemId) => {
  const { session, transactionOptions } = await startTransactionSession();

  try {
    await session.withTransaction(async () => {
      const purchaseList = await getPurchaseListById(purchaseListId);

      if (!purchaseList) throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');

      const selectedListItem = await listItemService.getListItemById(selectedListItemId);
      const unselectedListItem = await listItemService.getListItemById(unselectedListItemId);

      if (purchaseList.user.toString() !== user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      const purchaseListItem = await purchaseListItemService.createPurchaseListItem(
        user,
        purchaseList.id,
        selectedListItemId,
        unselectedListItemId
      );

      if (!purchaseListItem) throw new ApiError(httpStatus.NOT_FOUND, 'Unable to add listItem to purchase list');

      purchaseList.totalAmount = sumWithFixed(purchaseList.totalAmount, selectedListItem.totalPrice);
      purchaseList.unselectedTotalAmount = sumWithFixed(purchaseList.unselectedTotalAmount, unselectedListItem.totalPrice);
      purchaseList.purchaseListItems.unshift(purchaseListItem);
      purchaseList.itemsCount = purchaseList.purchaseListItems.length;

      await updateAdditionalCosts(purchaseList, selectedListItem, selectedListItem.totalPrice);
      await updateAdditionalCosts(purchaseList, unselectedListItem, unselectedListItem.totalPrice);

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

const removePurchaseListItem = async (user, purchaseListItemId) => {
  const { session, transactionOptions } = await startTransactionSession();

  try {
    await session.withTransaction(async () => {
      const purchaseListItem = await purchaseListItemService.getPurchaseListItemById(purchaseListItemId);
      if (!purchaseListItem) throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');

      const purchaseList = await getPurchaseListById(purchaseListItem.purchaseList);

      if (!purchaseList) throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');

      if (purchaseListItem.user._id.toString() !== user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      const selectedListItem = await listItemService.getListItemById(purchaseListItem.listItem);
      if (!purchaseListItem) throw new ApiError(httpStatus.NOT_FOUND, 'List item not found in purchase list item');

      const { unselectedListItem } = purchaseListItem;
      await purchaseListItemService.removePurchaseListItemById(purchaseListItemId);
      purchaseList.purchaseListItems = purchaseList.purchaseListItems.filter(
        (listItem) => listItem._id.toString() !== purchaseListItemId
      );
      purchaseList.totalAmount = subtractWithFixed(purchaseList.totalAmount, selectedListItem.totalPrice);

      purchaseList.unselectedTotalAmount = subtractWithFixed(
        purchaseList.unselectedTotalAmount,
        unselectedListItem.totalPrice
      );
      purchaseList.itemsCount = purchaseList.purchaseListItems.length;

      await updateAdditionalCosts(purchaseList, selectedListItem, -selectedListItem.totalPrice);
      await updateAdditionalCosts(purchaseList, unselectedListItem, -unselectedListItem.totalPrice);

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
  queryLists,
  getPurchaseListById,
  getPurchaseListWithPriceSaving,
  updatePurchaseListById,
  deletePurchaseListById,
  addPurchaseListItem,
  removePurchaseListItem,
};
