const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { purchaseListItemService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const getPurchaseListItems = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await purchaseListItemService.queryPurchaseListItems({ user: req.user.id }, options);
  res.send({ result });
});

const getPurchaseListItemById = catchAsync(async (req, res) => {
  const purchaseListItem = await purchaseListItemService.getPurchaseListItemById(req.params.purchaseListItemId);
  if (!purchaseListItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list item not found');
  }
  res.send({ purchaseListItem });
});

module.exports = {
  getPurchaseListItemById,
  getPurchaseListItems,
};
