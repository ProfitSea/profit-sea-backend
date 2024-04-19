const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { purchaseListService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const getPurchaseLists = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await purchaseListService.queryLists({ user: req.user.id }, options);
  res.send({ result });
});

const upsertPurchaseList = catchAsync(async (req, res) => {
  const purchaseList = await purchaseListService.upsertPurchaseList(req.user, req.query.listId);
  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');
  }
  res.send({ purchaseList });
});

const getPurchaseList = catchAsync(async (req, res) => {
  const purchaseList = await purchaseListService.getPurchaseListWithPriceSaving(req.user, req.params.listId);
  if (!purchaseList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase list not found');
  }
  res.send({ purchaseList });
});

const updatePurchaseListName = catchAsync(async (req, res) => {
  const purchaseList = await purchaseListService.updatePurchaseListById(req.params.purchaseListId, req.body);
  res.send({ purchaseList });
});

const deletePurchaseList = catchAsync(async (req, res) => {
  await purchaseListService.deletePurchaseListById(req.params.purchaseListId);
  res.status(httpStatus.NO_CONTENT).send();
});

const addPurchaseListItem = catchAsync(async (req, res) => {
  const { purchaseListId } = req.params;
  const { selectedListItemId, unselectedListItemId } = req.query;
  const purchaseListItem = await purchaseListService.addPurchaseListItem(
    req.user,
    purchaseListId,
    selectedListItemId,
    unselectedListItemId
  );
  res.status(httpStatus.CREATED).send({ purchaseListItem });
});

const removePurchaseListItem = catchAsync(async (req, res) => {
  const { purchaseListItemId } = req.params;
  await purchaseListService.removePurchaseListItem(req.user, purchaseListItemId);
  res.status(httpStatus.OK).send();
});

module.exports = {
  getPurchaseLists,
  getPurchaseList,
  updatePurchaseListName,
  deletePurchaseList,
  addPurchaseListItem,
  removePurchaseListItem,
  upsertPurchaseList,
};
