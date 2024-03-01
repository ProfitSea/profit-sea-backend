// const httpStatus = require('http-status');
const { PurchaseList } = require('../models');
// const ApiError = require('../utils/ApiError');
// const listItemService = require('./purchaseListItem.service');

// const { updateProductById } = require('./product.service');

/**
 * Create a list
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

module.exports = {
  createPurchaseList,
};
