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
  return PurchaseListItem.findById(purchaseListItemId)
    .populate({
      path: 'user',
    })
    .populate({
      path: 'priceAtOrder.saleUnit',
      model: 'ProductSaleUnit',
    })
    .populate({
      path: 'priceAtOrder.price',
      model: 'Price',
    })
    .populate({
      path: 'unselectedListItem',
    });
};

/**
 * Create purchase list item
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const createPurchaseListItem = async (
  user,
  purchaseListId,
  selectedListItem,
  unselectedListItem,
  recommendation,
  session
) => {
  const purchaseListItemPayload = {
    user: user.id,
    purchaseList: purchaseListId,
    listItem: selectedListItem.id,
    priceAtOrder: selectedListItem.saleUnitQuantities,
    unselectedListItem: unselectedListItem.id,
    recommendation,
  };
  const purchaseListItem = new PurchaseListItem(purchaseListItemPayload);
  if (session) {
    await purchaseListItem.save({ session });
  } else {
    await purchaseListItem.save();
  }
  return purchaseListItem;
};

const createAnchoredPurchaseListItem = async (user, purchaseListId, listItem, session) => {
  const purchaseListItem = PurchaseListItem({
    user: user.id,
    purchaseList: purchaseListId,
    listItem: listItem.id,
    priceAtOrder: listItem.saleUnitQuantities,
    isAnchored: true,
  });

  if (session) {
    await purchaseListItem.save({ session });
  } else {
    await purchaseListItem.save();
  }

  return purchaseListItem;
};

/**
 * Delete purchase list item
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const removePurchaseListItemById = async (purchaseListItemId, session) => {
  const purchaseListItem = await PurchaseListItem.findById(purchaseListItemId);
  if (!purchaseListItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');
  }
  if (session) await purchaseListItem.remove({ session });
  else await purchaseListItem.remove();
};

module.exports = {
  queryPurchaseListItems,
  getPurchaseListItemById,
  createPurchaseListItem,
  removePurchaseListItemById,
  createAnchoredPurchaseListItem,
};
