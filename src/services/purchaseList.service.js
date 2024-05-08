/* eslint-disable no-await-in-loop */
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { PurchaseList } = require('../models');
const ApiError = require('../utils/ApiError');
const { subtractWithFixed, sumWithFixed } = require('../utils/helper');
const purchaseListItemService = require('./purchaseListItem.service');
const listItemService = require('./listItem.service');
const logger = require('../config/logger');
const { listService } = require('./index');

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
        populate: [
          {
            path: 'product',
            model: 'Products',
            populate: [
              {
                path: 'vendor',
              },
            ],
          },
          {
            path: 'vendor',
          },
          {
            path: 'saleUnitQuantities.saleUnit',
            model: 'ProductSaleUnit',
          },
          {
            path: 'saleUnitQuantities.price',
            model: 'Price',
          },
          {
            path: 'comparisonProducts',
            model: 'ListItem',
            populate: [
              {
                path: 'product',
                model: 'Products',
                populate: [
                  {
                    path: 'vendor',
                  },
                ],
              },
              {
                path: 'vendor',
              },
              {
                path: 'saleUnitQuantities.saleUnit',
                model: 'ProductSaleUnit',
              },
              {
                path: 'saleUnitQuantities.price',
                model: 'Price',
              },
            ],
          },
        ],
      },
    ],
  });
};

const getPurchaseListWithPriceSaving = async (user, listId) => {
  const listObjectId = mongoose.Types.ObjectId(listId);

  const purchaseList = await PurchaseList.findOne({ list: listObjectId }).populate({
    path: 'purchaseListItems',
    populate: [
      {
        path: 'listItem',
        model: 'ListItem',
        populate: [
          {
            path: 'product',
            model: 'Products',
            populate: [
              {
                path: 'vendor',
              },
            ],
          },
          {
            path: 'vendor',
          },
          {
            path: 'saleUnitQuantities.saleUnit',
            model: 'ProductSaleUnit',
          },
          {
            path: 'saleUnitQuantities.price',
            model: 'Price',
          },
          {
            path: 'comparisonProducts',
            model: 'ListItem',
            populate: [
              {
                path: 'product',
                model: 'Products',
                populate: [
                  {
                    path: 'vendor',
                  },
                ],
              },
              {
                path: 'vendor',
              },
              {
                path: 'saleUnitQuantities.saleUnit',
                model: 'ProductSaleUnit',
              },
              {
                path: 'saleUnitQuantities.price',
                model: 'Price',
              },
            ],
          },
        ],
      },
    ],
  });
  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase List not found');
  }
  return purchaseList;
};

const deleteExistingPurchaseListAndPurchaseListItems = async (purchaseList, session) => {
  for (let i = 0; i < purchaseList.purchaseListItems.length; i += 1) {
    await purchaseListItemService.removePurchaseListItemById(purchaseList.purchaseListItems[i], session);
  }

  if (session) await purchaseList.remove({ session });
  else await purchaseList.remove();
};

const createPurchaseList = async (user, list, session) => {
  const purchaseList = await PurchaseList({
    name: list.name,
    user: user.id,
    list: list.id,
  });

  await purchaseList.save({ session });

  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Error occured while creating Purchase List');
  }
  const purchaseListItems = [];

  for (let i = 0; i < list.listItems.length; i += 1) {
    const listItem = list.listItems[i];
    let purchaseListItem;
    if (listItem.isAnchored) {
      purchaseListItem = await purchaseListItemService.createAnchoredPurchaseListItem(
        user,
        purchaseList.id,
        listItem,
        session
      );
      purchaseListItems.push(purchaseListItem);
    } else if (listItem.isBaseProduct) {
      if (listItem.comparisonProducts.length > 0) {
        if (listItem.isSelected) {
          purchaseListItem = await purchaseListItemService.createPurchaseListItem(
            user,
            purchaseList.id,
            listItem,
            listItem.comparisonProducts[0],
            listItem.recommendation,
            session
          );
          purchaseListItems.push(purchaseListItem);
        } else if (listItem.comparisonProducts[0].isSelected) {
          purchaseListItem = await purchaseListItemService.createPurchaseListItem(
            user,
            purchaseList.id,
            listItem.comparisonProducts[0],
            listItem,
            listItem.recommendation,
            session
          );
          purchaseListItems.push(purchaseListItem);
        }
        // else if (listItem.recommendation.listItemId.toString() === listItem.id.toString()) {
        //   purchaseListItem = await purchaseListItemService.createPurchaseListItem(
        //     user,
        //     purchaseList.id,
        //     listItem,
        //     listItem.comparisonProducts[0],
        //     listItem.recommendation,
        //     session
        //   );
        //   purchaseListItems.push(purchaseListItem);
        // } else if (listItem.recommendation.listItemId.toString() === listItem.comparisonProducts[0].id.toString()) {
        //   purchaseListItem = await purchaseListItemService.createPurchaseListItem(
        //     user,
        //     purchaseList.id,
        //     listItem.comparisonProducts[0],
        //     listItem,
        //     listItem.recommendation,
        //     session
        //   );
        //   purchaseListItems.push(purchaseListItem);
        // }
      }
    }
  }

  purchaseList.purchaseListItems = purchaseListItems.map((item) => item.id);
  await purchaseList.save();

  return purchaseList;
};

const upsertPurchaseList = async (user, listId) => {
  // first we need to check if there is any existing
  // purchase list for this list or not if yes then update it
  // else create a new one

  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start a new transaction

  const listObjectId = mongoose.Types.ObjectId(listId);
  const list = await listService.getListById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }

  let purchaseList = await PurchaseList.findOne({ list: listObjectId });
  try {
    if (!purchaseList) {
      purchaseList = await createPurchaseList(user, list, session);
    } else {
      // want to update Purchase list here and then return it
      // delete all the old purchase list items
      await deleteExistingPurchaseListAndPurchaseListItems(purchaseList, session);
      // update purchase list according to the list
      purchaseList = await createPurchaseList(user, list, session);
    }
    await session.commitTransaction(); // Commit the transaction if all operations succeed
    session.endSession(); // End the session
    return getPurchaseListById(purchaseList.id);
  } catch (error) {
    await session.abortTransaction();
    throw error; // Rethrow the error to handle it in the caller
  } finally {
    session.endSession();
  }
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
  upsertPurchaseList,
};
