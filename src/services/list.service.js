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
  return await List.findById(listId).populate({
    path: 'listItems',
    populate: [
      {
        path: 'product',
        populate: [
          {
            path: 'vendor',
          },
        ],
      },
      {
        path: 'vendor',
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
            populate: [
              {
                path: 'vendor',
              },
            ],
          },
          {
            path: 'vendor',
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

// TODO: update this: remove productNumber, brand and add listItem id
const formatProduct = (product) => {
  return `productId: ${product.productId}, vendor: ${product.vendor.name},  description: ${product.description}, price/unit: $${product.price}/${product.unit}, packSize/unit: ${product.packSize}/${product.unit}, Qty: ${product.quantity}, Total $${product.totalPrice} `;
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
 * Retrieve recommendations for list analysis based on the products selected for comparison
 * @param {User} user - User authenticated within the active session
 * @param {ObjectId} listId list ID to analyze
 * @returns {Promise<List>}
 */

const getListAnalysis = async (user, listId) => {
  // Retrieve the list by ID
  let list = await getListById(listId);

  if (!list) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ListItem not found');
  }
  if (list.user.toString() !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  if (!list.itemsCount) {
    return [];
  }

  const groupedProducts = {};
  for (const listItem of list.listItems) {
    if (listItem.isBaseProduct && !listItem.isAnchored) {
      const productId = listItem.product._id.toString();
      if (!groupedProducts[productId]) {
        groupedProducts[productId] = [];
      }
      groupedProducts[productId].push(extractProductInfo(listItem));
      for (const comparisonListItem of listItem.comparisonProducts) {
        groupedProducts[productId].push(extractProductInfo(comparisonListItem));
      }
    }
  }

  console.log('======================groupedProducts+++');
  console.log(groupedProducts);
  console.log('======================');
  const groupedProductsArray = Object.values(groupedProducts);
  if (!groupedProductsArray.length) return [];
  const productInfoForAiRecommendation = formatList(groupedProductsArray);

  console.log({ productInfoForAiRecommendation });
  // Send recommendation requests in parallel
  const recommendations = await Promise.all(
    productInfoForAiRecommendation.map(async (group) => {
      const groupString = group.join();

      console.log({ groupString });
      const openAiService = new OpenAiService();
      return await openAiService.getRecomendation(groupString);
    })
  );

  console.log({ groupedProductsArray });

  console.log('');
  console.log('');
  console.log('');
  // Update list items with recommendations
  const updatePromises = list.listItems
    .filter((listItem) => listItem.isBaseProduct)
    .map(async (listItem, index) => {
      listItem.recommendation = {};
      listItem.recommendation.priceSaving = recommendations[index]?.priceSaving;
      listItem.recommendation.reason = recommendations[index]?.suggestionReason;
      console.log('recommendations[index]? productId papa: ', index);
      console.log(recommendations[index]?.productId);
      const listItemById = await listItemService.getListItemByProductId(recommendations[index]?.productId);
      console.log(' listItemById by id }!------ renovado');
      console.log({ listItemById });
      console.log('');
      listItem.recommendation.listItemId = listItemById.id;
      await listItem.save();
    });

  await Promise.all(updatePromises); // Wait for all updates to complete
  // Fetch updated list after saving
  const updatedList = await getListById(listId);
  const isBaseProductListItems = updatedList.listItems.filter((listItem) => listItem.isBaseProduct && !listItem.isAnchored);
  return isBaseProductListItems;
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
