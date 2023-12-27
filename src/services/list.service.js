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
  const prompt = `Tell me under which category does this product ${product?.brand} ${product?.description} fall under
  Categories: 
  Meats
  Seafood
  Produce
  Dairy Products
  Bakery and Bread
  Dry Goods and Grains
  Canned and Jarred Goods
  Condiments and Sauces
  Beverages
  Frozen Foods
  Oils and Fats
  Specialty Items
  Cleaning Supplies
  Paper Goods
  Kitchen Essentials
  Bar Supplies
  Coffee and Tea
  Alcohol
  Dessert items

  Structure the response as the following: "Category"
  `
  //get product's category
  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt,
    temperature: 0.2,
    max_tokens: 500
  });
  const productItem = {...product, category: response?.choices[0].text.trim()}
  const listItem = await listItemService.createListItem(user, listId, productItem);

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
  const list = await getListById(listId);
  const categories = list?.listItems?.reduce((acc, element)=>{
    const category = element?.product?.category;
    if (!acc[category]) {
      acc[category] = [];
    }
  
    acc[category].push(element?.product);
    return acc;
  },{});
  const categorizedList = [];
  Object.keys(categories).forEach((key) => {
    const category = categories[key];
    categorizedList.push(category);
  })
// for (let index = 0; index < categorizedList.length; index++) {
//   const element = categorizedList[index];
//   const products = element.map((product)=> `ID ${product?.id} product ${product?.brand} ${product?.description}`)
//     const text = `
//   group ids from different vendors by product categories and return the ID for these groups. Structure the response as the following: 
//   Category Group # IDs: [ids]

//   Items:
//   ${JSON.stringify(products)}
//   `

//   const response = await openai.completions.create({
//     model: "gpt-3.5-turbo-instruct",
//     prompt: text,
//     temperature: 0.2,
//     max_tokens: 500
//   });

//   console.log(response);
  
// }

// // Define a regular expression pattern to match the category and IDs
// const regex = /Category Group (\d+) IDs: (\[[^\]]+\])/g;

// // Initialize an array to store the results
// const result = [];

// // Use the regular expression to find matches in the input string
// let match;
// while ((match = regex.exec(response.choices[0].text)) !== null) {
//   const category = match[1];
//   const idsString = match[2];
  
//   // Parse the IDs from the string to a JavaScript array
//   const ids = JSON.parse(idsString);

//   // Add the result to the array
//   result.push({ category, ids });
// }

  return {
  categorizedList
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
