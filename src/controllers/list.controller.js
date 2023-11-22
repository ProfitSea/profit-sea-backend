const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { listService } = require('../services');

const createList = catchAsync(async (req, res) => {
  const list = await listService.createList(req.user);
  res.status(httpStatus.CREATED).send({ list });
});

const addListItem = catchAsync(async (req, res) => {
  const listItem = await listService.addListItem(req.user, req.params.listId, req.body.product);
  res.status(httpStatus.CREATED).send({ listItem });
});

const removeListItem = catchAsync(async (req, res) => {
  await listService.removeListItem(req.user, req.params.listId, req.params.listItemId);
  res.status(httpStatus.OK).send();
});

const getLists = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['vendor', 'brand', 'description', 'listNumber']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (filter.brand) {
    filter.brand = { $regex: filter.brand, $options: 'i' };
  }

  if (filter.vendor) {
    filter.vendor = { $regex: filter.vendor, $options: 'i' };
  }

  const result = await listService.queryLists({ ...filter, user: req.user.id }, options);
  res.send({ result });
});

const getList = catchAsync(async (req, res) => {
  const list = await listService.getListById(req.params.listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }
  res.send({ list });
});

const updateList = catchAsync(async (req, res) => {
  const list = await listService.updateListById(req.params.listId, req.body);
  res.send({ list });
});

const updateListName = catchAsync(async (req, res) => {
  const list = await listService.updateListName(req.params.listId, req.user, req.body.name);
  res.send({ list });
});

const deleteList = catchAsync(async (req, res) => {
  await listService.deleteListById(req.params.listId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
  updateListName,
  addListItem,
  removeListItem,
};
