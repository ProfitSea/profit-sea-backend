const httpStatus = require('http-status');
const { PurchaseListItem } = require('../models');
const ApiError = require('../utils/ApiError');
const listItemService = require('./listItem.service');

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
const createPurchaseListItem = async (user, purchaseListId, selectedListItemId, unselectedListItemId) => {
  const existingPurchaseListItem = await PurchaseListItem.findOne({
    user: user.id,
    purchaseList: purchaseListId,
    listItem: selectedListItemId,
  });

  if (existingPurchaseListItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'List item was already added to the Purchase List');
  }

  const unselectedExistingPurchaseListItem = await PurchaseListItem.findOne({
    user: user.id,
    purchaseList: purchaseListId,
    listItem: unselectedListItemId,
  });

  if (unselectedExistingPurchaseListItem) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This product was already unselected therefore cannot be added to the Purchase List'
    );
  }

  const listItem = await listItemService.getListItemById(selectedListItemId);
  const purchaseListItemPayload = {
    user: user.id,
    purchaseList: purchaseListId,
    listItem: selectedListItemId,
    priceAtOrder: listItem.saleUnitQuantities,
    unselectedListItem: unselectedListItemId,
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
const removePurchaseListItemById = async (purchaseListItemId) => {
  const purchaseListItem = await PurchaseListItem.findById(purchaseListItemId);
  if (!purchaseListItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');
  }
  await purchaseListItem.remove();
};

module.exports = {
  queryPurchaseListItems,
  getPurchaseListItemById,
  createPurchaseListItem,
  removePurchaseListItemById,
};
