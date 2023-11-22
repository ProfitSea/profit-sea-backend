const catchAsync = require('../utils/catchAsync');
const { listItemService } = require('../services');

const updateListItemQuantity = catchAsync(async (req, res) => {
  await listItemService.updateListItemQuantity(req.user, req.body.listItemId, req.body.saleUnitId, req.body.quantity);
  res.send({ message: 'Quantity updated' });
});

const updateListItemPrice = catchAsync(async (req, res) => {
  const listItem = await listItemService.updateListItemPrice(req.user, req.body.listItemId, req.body.prices);
  res.send({ listItem, message: 'Price updated' });
});

module.exports = {
  updateListItemQuantity,
  updateListItemPrice,
};
