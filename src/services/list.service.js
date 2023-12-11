const httpStatus = require('http-status');
const { List } = require('../models');
const ApiError = require('../utils/ApiError');
const listItemService = require('./listItem.service');
const OpenAI = require('openai');
const config = require('../config/config');

const openai = new OpenAI({
  apiKey: config.openAi.key,
});

/**
 * Create a list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const createList = async (user) => {
  return List.create({ user: user.id });
};

/**
 * Add product(listItem) in a list
 * @param {Object} listBody
 * @returns {Promise<List>}
 */
const addListItem = async (user, listId, product) => {
  const list = await List.findById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }

  const listItem = await listItemService.createListItem(user, listId, product);

  if (!listItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }
  list.listItems.unshift(listItem);
  list.itemsCount = list.listItems.length;
  await list.save();

  return listItem;
};

/**
 * delete product(listItem) in a list
 * @param {Object} listItemId
 * @returns {Promise<List>}
 */
const removeListItem = async (user, listId, listItemId) => {
  const list = await List.findOne({ _id: listId, user: user.id });
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }

  await listItemService.deleteListItemById(listItemId, user.id);

  list.listItems = list.listItems.filter((listItem) => listItem.toString() !== listItemId.toString());
  list.itemsCount = list.listItems.length;

  await list.save();
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
const queryLists = async (filter, options) => {
  const lists = await List.paginate(filter, options);
  return lists;
};

/**
 * Get list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const getListById = async (listId) => {
  return List.findById(listId).populate({
    path: 'listItems',
    populate: [
      {
        path: 'product',
      },
      {
        path: 'saleUnitQuantities.saleUnit',
        model: 'ProductSaleUnit', // Replace with the correct model name for sale units
      },
      {
        path: 'saleUnitQuantities.price',
        model: 'Price', // Replace with the correct model name for price
      },
    ],
  });
};
/**
 * Get list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const getListAnalysis = async (listId) => {
  console.log('Here we go')
  //Group items from different vendors by categories. Analyze these groups side by side and tell me which item and vendor is a better option based on price, quantity, and quality altogether per group. Just tell me vendor and item only in a chart side by side
  const text = `
  Perform an analysis and mark which item is recommended.

  Please compare these products by category and tell me which item to buy based on price, quantity, and quality altogether by category.

  Usfoods:
  $56.43 CS
  Inteplast
  Bag, Ice 12x21 Plastic Clear Penguin Stock Print Carry-out
  #7125028
  1000 EA per case
  
  Sysco:
  Handgard
  Bag Ice Poly 18 Inch X 18 Inch 1 Gallon Clear
  1/300 CT 6864857
  $62.65 CS
  ($0.21 / ct)

  Usfoods:
$28.99 CS
Packer
POTATO, FRENCH-FRY 1/2" CRINKLE-CUT FROZEN
#3351426
6/5 LB
$0.06 / OZ

Sysco:
Sysco Reliance
by
Sysco
Potato Fry Crinkle-cut 1/2"
6/5LB
1994294
$32.00 CS
($1.07 / lb)

Sysco:
Golden Crisp
Appetizer Pickle Chips Breaded
6/2.5LB
8902239
$83.95 CS
($5.60 / lb)

Usfoods:
Molly's Kitchen
APPETIZER, PICKLE BATTERED DILL CHIP TFF RAW FROZEN 35-55 COUNT
$61.76 CS
Available Cases: 389
#3705431
6/2 LB
  `

  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt: text,
    max_tokens: 500
  });

  console.log(response);
  return {s: 'here', response:
  response.choices[0].text
}
};

/**
 * Update list by id
 * @param {ObjectId} listId
 * @param {Object} updateBody
 * @returns {Promise<List>}
 */
const updateListById = async (listId, updateBody) => {
  const list = await getListById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }
  Object.assign(list, updateBody);
  await list.save();
  return list;
};

/**
 * Update list by id
 * @param {ObjectId} listId
 * @param {String} name
 * @returns {Promise<List>}
 */
const updateListName = async (listId, user, name) => {
  const list = await List.findOne({
    _id: listId,
    user: user.id,
  });
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }

  Object.assign(list, { name });
  await list.save();
  return list;
};

/**
 * Delete list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const deleteListById = async (listId) => {
  const list = await getListById(listId);
  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'List not found');
  }
  await list.remove();
  return list;
};

module.exports = {
  createList,
  queryLists,
  getListById,
  updateListById,
  deleteListById,
  updateListName,
  addListItem,
  removeListItem,
  getListAnalysis
};
