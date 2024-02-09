const catchAsync = require('../utils/catchAsync');
const { listItemService } = require('../services');

const addComparisonProduct = catchAsync(async (req, res) => {
  const productAddedToComparison = await listItemService.addComparisonProduct(
    req.user,
    req.params.baseProductListItemId,
    req.params.comparisonProductListItemId
  );
  res.send({ message: 'List item added to comparison group', productAddedToComparison });
});

const updateListItemQuantity = catchAsync(async (req, res) => {
  await listItemService.updateListItemQuantity(req.user, req.body.listItemId, req.body.saleUnitId, req.body.quantity);
  res.send({ message: 'Quantity updated' });
});

const updateListItemPrice = catchAsync(async (req, res) => {
  const listItem = await listItemService.updateListItemPrice(req.user, req.body.listItemId, req.body.prices);
  res.send({ listItem, message: 'Price updated' });
});

module.exports = {
  addComparisonProduct,
  updateListItemQuantity,
  updateListItemPrice,
};
