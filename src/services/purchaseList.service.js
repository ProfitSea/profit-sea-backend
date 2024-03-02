const httpStatus = require('http-status');
const { PurchaseList } = require('../models');
const ApiError = require('../utils/ApiError');
const purchaseListItemService = require('./purchaseListItem.service');

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
 * Add product(listItem) in a list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const addPurchaseListItem = async (user, purchaseList, listItemId) => {
  const purchaseListItem = await purchaseListItemService.createPurchaseListItem(user, purchaseList.id, listItemId);

  if (!purchaseListItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');
  }
  purchaseList.purchaseListItems.unshift(purchaseListItem);
  purchaseList.itemsCount = purchaseList.purchaseListItems.length;
  await purchaseList.save();

  return purchaseListItem;
};

/**
 * delete product(listItem) in a list
 * @param {Object} listItemId
 * @returns {Promise<List>}
 */
const removeListItem = async (user, listId, listItemId) => {
  const purchaseList = await PurchaseList.findOne({ _id: listId, user: user.id });
  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');
  }
  await purchaselistItemService.deletePurchaseListItemById(listItemId, user.id);
  // await purchaselistItemService.deletePurchaseListItemById(listItemId, user.id);

  purchaseList.listItems = purchaseList.listItems.filter((listItem) => listItem.toString() !== listItemId.toString());
  purchaseList.itemsCount = purchaseList.listItems.length;

  await purchaseList.save();
};

module.exports = {
  createPurchaseList,
  queryLists,
  getPurchaseListById,
  updatePurchaseListById,
  deletePurchaseListById,
  addPurchaseListItem,
  removeListItem,
};
