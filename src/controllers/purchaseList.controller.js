const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { purchaseListService } = require('../services');

const createPurchaseList = catchAsync(async (req, res) => {
  const { name, listId } = req.body;
  const purchaseList = await purchaseListService.createPurchaseList(req.user, name, listId);
  res.status(httpStatus.CREATED).send({ purchaseList });
});

module.exports = {
  createPurchaseList,
};
