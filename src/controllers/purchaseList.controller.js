const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { purchaseListService } = require('../services');
const pick = require('../utils/pick');
// const ApiError = require('../utils/ApiError');

const createPurchaseList = catchAsync(async (req, res) => {
  const { name, listId } = req.body;
  const purchaseList = await purchaseListService.createPurchaseList(req.user, name, listId);
  res.status(httpStatus.CREATED).send({ purchaseList });
});

const getPurchaseLists = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await purchaseListService.queryLists({ user: req.user.id }, options);
  res.send({ result });
});

module.exports = {
  createPurchaseList,
  getPurchaseLists,
};
