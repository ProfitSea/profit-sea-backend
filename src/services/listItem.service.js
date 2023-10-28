const httpStatus = require('http-status');
const { ListItem } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a list
 * @param {Object} listBody
 * @returns {Promise<ListItem>}
 */
const createListItem = async (user) => {
  return ListItem.create({ user: user.id });
};

/**
 * Query for lists
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryListItems = async (filter, options) => {
  const lists = await ListItem.paginate(filter, options);
  return lists;
};

/**
 * Get list by id
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const getListItemById = async (listId) => {
  return ListItem.findById(listId).populate('listItems');
};

/**
 * Update list by id
 * @param {ObjectId} listId
 * @param {Object} updateBody
 * @returns {Promise<ListItem>}
 */
const updateListItemById = async (listId, updateBody) => {
  const list = await getListItemById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }
  Object.assign(list, updateBody);
  await list.save();
  return list;
};

/**
 * Delete list by id
 * @param {ObjectId} listId
 * @returns {Promise<ListItem>}
 */
const deleteListItemById = async (listId) => {
  const list = await getListItemById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }
  await list.remove();
  return list;
};

module.exports = {
  createListItem,
  queryListItems,
  getListItemById,
  updateListItemById,
  deleteListItemById,
};
