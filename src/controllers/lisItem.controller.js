const catchAsync = require('../utils/catchAsync');
const { listItemService } = require('../services');

const addComparisonProduct = catchAsync(async (req, res) => {
  const [productAddedToComparison, message] = await listItemService.addComparisonProduct(
    req.user,
    req.params.baseProductListItemId,
    req.params.comparisonProductListItemId,
    req.query.action
  );
  res.send({ message, productAddedToComparison });
});

const removeComparisonProduct = catchAsync(async (req, res) => {
  const [productRemovedFromComparison, message] = await listItemService.removeComparisonProduct(
    req.user,
    req.params.baseProductListItemId,
    req.params.comparisonProductListItemId
  );
  res.send({ message, productRemovedFromComparison });
});

const updateListItemQuantity = catchAsync(async (req, res) => {
  await listItemService.updateListItemQuantity(req.user, req.body.listItemId, req.body.saleUnitId, req.body.quantity);
  res.send({ message: 'Quantity updated' });
});

const updateListItemPrice = catchAsync(async (req, res) => {
  const listItem = await listItemService.updateListItemPrice(req.user, req.body.listItemId, req.body.prices);
  res.send({ listItem, message: 'Price updated' });
});

const getListItem = catchAsync(async (req, res) => {
  const listItems = await listItemService.findListItemsByProductNumber(req.user, req.query);
  res.send({ listItems });
});

const updateListItemPricesByProductNumber = catchAsync(async (req, res) => {
  const listItems = await listItemService.updatePricesByProductNumber(req.user, req.query, req.body.prices);
  res.send({ listItems });
});

const getListItemById = catchAsync(async (req, res) => {
  const listItem = await listItemService.getListItemById(req.params.id);
  res.send({ listItem });
});

const toggleListItemAnchor = catchAsync(async (req, res) => {
  const listItem = await listItemService.toggleListItemAnchor(req.user, req.params.id);
  res.send({ listItem, message: 'List item anchored' });
});

module.exports = {
  addComparisonProduct,
  removeComparisonProduct,
  updateListItemQuantity,
  updateListItemPrice,
  getListItem,
  updateListItemPricesByProductNumber,
  getListItemById,
  toggleListItemAnchor,
};
