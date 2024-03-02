const httpStatus = require('http-status');
const { PurchaseListItem } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get purchaseListItem by id
 * @param {ObjectId} listItemId
 * @returns {Promise<ListItem>}
 */
const getPurchaseListItemById = async (purchaseListItemId) => {
  try {
    const purchaseListItem = await PurchaseListItem.findById(purchaseListItemId)
      .populate('purchaselist')
      .populate('user')
      .populate('listItem')
      .populate('priceAtOrder.saleUnit')
      .populate('priceAtOrder.price');

    if (!purchaseListItem) {
      throw new ApiError('Purchase list item not found');
    }

    return purchaseListItem;
  } catch (error) {
    throw new ApiError(`Error retrieving purchase list item: ${error.message}`);
  }
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
  });

  if (existingPurchaseListItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'List item was already added to the Puchase List');
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
const deletePurchaseListItemById = async (purchaseListItemId, userId) => {
  const purchaseListItem = await PurchaseListItem.findOne({ _id: purchaseListItemId, user: userId });
  if (!purchaseListItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');
  }
  await purchaseListItem.remove();
};

module.exports = {
  getPurchaseListItemById,
  createPurchaseListItem,
  deletePurchaseListItemById,
};
