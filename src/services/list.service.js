const httpStatus = require('http-status');
const { List } = require('../models');
const ApiError = require('../utils/ApiError');
const listItemService = require('./listItem.service');
const OpenAiService = require('./openai.service');

const OpenAI = require('openai');
const config = require('../config/config');
const { updateProductById } = require('./product.service');

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

  const openAiService = new OpenAiService();
  const category = await openAiService.getProductCategory(product?.brand, product?.description);

  const productItem = { ...product, category };
  console.log('product item to add->>');
  console.log(productItem);
  const listItem = await listItemService.createListItem(user, listId, productItem);

  console.log('open ai');
  console.log({ category });
  console.log({ productItem });
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
  return await List.findById(listId).populate({
    path: 'listItems',
    populate: [
      {
        path: 'product',
      },
      {
        path: 'saleUnitQuantities.saleUnit',
        model: 'ProductSaleUnit',
      },
      {
        path: 'saleUnitQuantities.price',
        model: 'Price',
      },
      {
        path: 'comparisonProducts',
        model: 'ListItem',
        populate: [
          {
            path: 'product',
          },
          {
            path: 'saleUnitQuantities.saleUnit',
            model: 'ProductSaleUnit',
          },
          {
            path: 'saleUnitQuantities.price',
            model: 'Price',
          },
        ],
      },
    ],
  });
};

const formatProduct = (product) => {
  return ` productNumber: ${product.productNumber},  ${product.brand}, ${product.vendor},  description: ${product.description}, price/unit: $${product.price}/${product.unit}, packSize/unit: ${product.packSize}/${product.unit}, Qty: ${product.quantity}, Total $${product.totalPrice} `;
};

const formatProductGroup = (productGroup) => {
  return productGroup.map(formatProduct);
};

const formatList = (list) => {
  return list.map(formatProductGroup);
};

function extractProductInfo(item) {
  return {
    listItemId: item._id.toString(),
    productId: item.product.id,
    vendor: item.vendor,
    brand: item.product.brand,
    description: item.product.description,
    productNumber: item.product.productNumber,
    packSize: item.product.packSize,
    totalPrice: item?.totalPrice,
    price: item?.saleUnitQuantities[0].price?.price,
    quantity: item?.saleUnitQuantities[0].quantity,
    unit: item?.saleUnitQuantities[0]?.saleUnit?.unit,
  };
}

/**
 * Get list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */

const getListAnalysis = async (listId) => {
  // Retrieve the list by ID
  const list = await getListById(listId);

  // Initialize groupedProducts and listItemsWithComparisonProducts
  const groupedProducts = {};
  const listItemsWithComparisonProducts = [];

  // Iterate through each list item
  for (const listItem of list.listItems) {
    // If it's a base product, add it to groupedProducts and listItemsWithComparisonProducts
    if (listItem.isBaseProduct) {
      const listItemWithNoComparisonProducts = { ...extractProductInfo(listItem), comparisonProducts: [] };
      listItemsWithComparisonProducts.push(listItemWithNoComparisonProducts);
      groupedProducts[listItem.product._id.toString()] = [extractProductInfo(listItem)];

      // Iterate through comparison products
      for (const comparisonProduct of listItem.comparisonProducts) {
        const comparisonProductInfo = extractProductInfo(comparisonProduct);
        groupedProducts[listItem.product._id.toString()].push(comparisonProductInfo);

        // Update comparison products for list items
        const listItemToUpdate = listItemsWithComparisonProducts.find((elem) => elem.listItemId === listItem._id.toString());
        listItemToUpdate.comparisonProducts.push(comparisonProductInfo);
      }
    }
  }

  // Convert groupedProducts object to array
  const groupedProductsArray = Object.values(groupedProducts);

  // Format list for recommendation for AI
  const productInfoForRecommendation = formatList(groupedProductsArray);

  // Send recommendation requests in parallel
  const recommendations = await Promise.all(
    productInfoForRecommendation.map(async (group) => {
      const groupString = group.join();
      const openAiService = new OpenAiService();
      return await openAiService.getRecomendation(groupString);
    })
  );

  // Assign recommendations to list items
  listItemsWithComparisonProducts.forEach((elem, index) => {
    elem.recommendation = recommendations[index];
  });

  return listItemsWithComparisonProducts;
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
  getListAnalysis,
};
