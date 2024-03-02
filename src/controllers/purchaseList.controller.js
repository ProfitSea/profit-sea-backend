const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { purchaseListService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

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

const getPurchaseList = catchAsync(async (req, res) => {
  const purchaseList = await purchaseListService.getPurchaseListById(req.params.purchaseListId);
  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');
  }
  res.send({ purchaseList });
});

const updatePurchaseList = catchAsync(async (req, res) => {
  const purchaseList = await purchaseListService.updatePurchaseListById(req.params.purchaseListId, req.body);
  res.send({ purchaseList });
});

const deletePurchaseList = catchAsync(async (req, res) => {
  await purchaseListService.deletePurchaseListById(req.params.purchaseListId);
  res.status(httpStatus.NO_CONTENT).send();
});

const addPurchaseListItem = catchAsync(async (req, res) => {
  const { purchaseListId, listItemId } = req.params;
  const purchaseList = await purchaseListService.getPurchaseListById(purchaseListId);

  if (purchaseList.user.toString() !== req.user.id) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

  const purchaseListItem = await purchaseListService.addPurchaseListItem(req.user, purchaseList, listItemId);
  res.status(httpStatus.CREATED).send({ purchaseListItem });
});

const removePurchaseListItem = catchAsync(async (req, res) => {
  const { purchaseListId, purchaseListItemId } = req.params;
  await purchaseListService.removePurchaseListItem(req.user, purchaseListId, purchaseListItemId);
  res.status(httpStatus.OK).send();
});

module.exports = {
  createPurchaseList,
  getPurchaseLists,
  getPurchaseList,
  updatePurchaseList,
  deletePurchaseList,
  addPurchaseListItem,
  removePurchaseListItem,
};
