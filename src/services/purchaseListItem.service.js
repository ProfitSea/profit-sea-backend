const httpStatus = require('http-status');
const { PurchaseListItem } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Query for purchase list items
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPurchaseListItems = async (filter, options) => {
  const lists = await PurchaseListItem.paginate(filter, options);
  return lists;
};

/**
 * Get purchse list item by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const getPurchaseListItemById = async (purchaseListItemId) => {
  return PurchaseListItem.findById(purchaseListItemId).populate({
    path: 'user',
  });
};

/**
 * Create purchase list item
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const createPurchaseListItem = async (user, purchaseListId, listItemId) => {
  const existingPurchaseListItem = await PurchaseListItem.findOne({
    user: user.id,
    purchaseList: purchaseListId,
    listItem: listItemId,
  });

  if (existingPurchaseListItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'List item was already added to the Purchase List');
  }
  const purchaseListItemPayload = {
    user: user.id,
    purchaseList: purchaseListId,
    listItem: listItemId,
    priceAtOrder: [],
  };
  const purchaseListItem = new PurchaseListItem(purchaseListItemPayload);
  await purchaseListItem.save();
  return purchaseListItem;
};

/**
 * Delete purchase list item
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const removePurchaseListItemByListItemId = async (listItemId, userId) => {
  const purchaseListItem = await PurchaseListItem.findOne({ listItem: listItemId, user: userId });
  if (!purchaseListItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');
  }
  const purchaseListItemId = purchaseListItem._id;
  await purchaseListItem.remove();
  return purchaseListItemId.toString();
};

module.exports = {
  queryPurchaseListItems,
  getPurchaseListItemById,
  createPurchaseListItem,
  removePurchaseListItemByListItemId,
};
