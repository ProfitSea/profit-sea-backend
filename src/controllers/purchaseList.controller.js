const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { purchaseListService } = require('../services');

const createPurchaseList = catchAsync(async (req, res) => {
  const purchaseList = await purchaseListService.createPurchaseList(req.user);
  res.status(httpStatus.CREATED).send({ purchaseList });
});

module.exports = {
  createPurchaseList,
};
