const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { PurchaseList } = require('../models');
const ApiError = require('../utils/ApiError');
const { subtractWithFixed, sumWithFixed } = require('../utils/helper');
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

const getPurchaseListWithPriceSaving = async (listId) => {
  const purchaseList = await PurchaseList.findById(listId).populate({
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

/**
 * Add product(listItem) in a purchase list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const addPurchaseListItem = async (user, purchaseListId, selectedListItemId, unselectedListItemId) => {
  const session = await mongoose.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };
  try {
    await session.withTransaction(async () => {
      const purchaseList = await getPurchaseListById(purchaseListId);
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

      // purchaseList.unselectedListItemId = unselectedListItemId;
      const existingSelectedVendor = purchaseList.additionalCost.find((vendor) =>
        vendor.vendor.equals(selectedListItem.vendor)
      );
      const existingUnselectedVendor = purchaseList.additionalCost.find((vendor) =>
        vendor.vendor.equals(unselectedListItem.vendor)
      );

      if (existingSelectedVendor) {
        // If the vendor already exists, update its totalAmount and priceSaving
        existingSelectedVendor.totalAmount = sumWithFixed(existingSelectedVendor.totalAmount, selectedListItem.totalPrice);
        await existingSelectedVendor.save();
      } else {
        // If the vendor doesn't exist, add a new entry
        purchaseList.additionalCost.push({
          vendor: selectedListItem.vendor,
          totalAmount: selectedListItem.totalPrice,
        });
      }
      if (existingUnselectedVendor) {
        // If the vendor already exists, update its totalAmount and priceSaving
        existingUnselectedVendor.totalAmount = sumWithFixed(
          existingUnselectedVendor.totalAmount,
          unselectedListItem.totalPrice
        );
        await existingUnselectedVendor.save();
      } else {
        // If the vendor doesn't exist, add a new entry
        purchaseList.additionalCost.push({
          vendor: unselectedListItem.vendor,
          totalAmount: unselectedListItem.totalPrice,
        });
      }

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

      const selectedListItem = await listItemService.getListItemById(listItemId);
      // const unselectedListItem = await listItemService.getListItemById(unselectedListItemId);
      const purchaseListItem = await purchaseListItemService.getPurchaseListItemByListItemId(listItemId, user.id);

      if (!purchaseListItem) throw new ApiError(httpStatus.NOT_FOUND, 'List item not found in purchase list item');
      if (purchaseListItem.user.toString() !== user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      const { unselectedListItem } = purchaseListItem;
      // const unselectedListItem = await listItemService.getListItemById(purchaseListItem.unselectedListItem);

      if (!purchaseList) throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');
      if (purchaseList.user.toString() !== user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

      const purchaseListItemId = await purchaseListItemService.removePurchaseListItemByListItemId(listItemId, user.id);

      purchaseList.purchaseListItems = purchaseList.purchaseListItems.filter(
        (listItem) => listItem._id.toString() !== purchaseListItemId
      );

      purchaseList.totalAmount = subtractWithFixed(purchaseList.totalAmount, selectedListItem.totalPrice);

      purchaseList.unselectedTotalAmount = subtractWithFixed(
        purchaseList.unselectedTotalAmount,
        unselectedListItem.totalPrice
      );

      purchaseList.itemsCount = purchaseList.purchaseListItems.length;

      // purchaseList.unselectedListItemId = unselectedListItemId;
      const existingSelectedVendor = purchaseList.additionalCost.find((vendor) =>
        vendor.vendor.equals(selectedListItem.vendor)
      );
      const existingUnselectedVendor = purchaseList.additionalCost.find((vendor) =>
        vendor.vendor.equals(unselectedListItem.vendor)
      );

      if (existingSelectedVendor) {
        // If the vendor already exists, update its totalAmount and priceSaving
        existingSelectedVendor.totalAmount = subtractWithFixed(
          existingSelectedVendor.totalAmount,
          selectedListItem.totalPrice
        );

        await existingSelectedVendor.save();
      } else {
        // If the vendor doesn't exist, add a new entry
        purchaseList.additionalCost.push({
          vendor: selectedListItem.vendor,
          totalAmount: selectedListItem.totalPrice,
        });
      }
      if (existingUnselectedVendor) {
        // If the vendor already exists, update its totalAmount and priceSaving
        existingUnselectedVendor.totalAmount = subtractWithFixed(
          existingUnselectedVendor.totalAmount,
          unselectedListItem.totalPrice
        );
        await existingUnselectedVendor.save();
      } else {
        // If the vendor doesn't exist, add a new entry
        purchaseList.additionalCost.push({
          vendor: unselectedListItem.vendor,
          totalAmount: unselectedListItem.totalPrice,
        });
      }
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
  getPurchaseListWithPriceSaving,
  updatePurchaseListById,
  deletePurchaseListById,
  addPurchaseListItem,
  removePurchaseListItem,
};
