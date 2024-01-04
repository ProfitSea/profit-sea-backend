const httpStatus = require('http-status');
const { List } = require('../models');
const ApiError = require('../utils/ApiError');
const listItemService = require('./listItem.service');
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
  const prompt = `Tell me under which category does this product ${product?.brand} ${product?.description} fall under
  Categories: 
Beef
Pork
Poultry
Lamb
Exotic meats
Fish
Shellfish
Other seafood items
Fresh fruits
Fresh vegetables
Herbs
Milk
Cheese
Butter
Cream
Bread
Rolls
Pastries
Baked goods
Rice
Pasta
Flour
Sugar
Vegetables
Fruits
Sauces
Preserves
Ketchup
Mustard
Mayonnaise
Salad dressings
Cooking sauces
Spices
Soft drinks
Juices
Bottled water
Alcoholic beverages (Wine, Beer)
Ice cream
Frozen vegetables
Other frozen products
Cooking oils
Lard
Other fats
Tofu
Ethnic spices
Regional ingredients
Detergents
Sanitizers
Cleaning tools
Napkins
Paper towels
Toilet paper
Disposable items
To-go Containers
Cooking utensils
Pots
Pans
Mixers
Spirits
Bar tools
Coffee varieties
Tea varieties

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
  // for (let index = 0; index < list.listItems.length; index++) {
  //   const element = list.listItems[index];
  //   if(!element?.product?.category){
  //       const prompt = `Tell me under which category does this product ${element?.product?.brand} ${element?.product?.description} fall under
  //     Categories: 
  //   Beef
  //   Pork
  //   Poultry
  //   Lamb
  //   Exotic meats
  //   Fish
  //   Shellfish
  //   Other seafood items
  //   Fresh fruits
  //   Fresh vegetables
  //   Herbs
  //   Milk
  //   Cheese
  //   Butter
  //   Cream
  //   Bread
  //   Rolls
  //   Pastries
  //   Baked goods
  //   Rice
  //   Pasta
  //   Flour
  //   Sugar
  //   Vegetables
  //   Fruits
  //   Sauces
  //   Preserves
  //   Ketchup
  //   Mustard
  //   Mayonnaise
  //   Salad dressings
  //   Cooking sauces
  //   Spices
  //   Soft drinks
  //   Juices
  //   Bottled water
  //   Alcoholic beverages (Wine, Beer)
  //   Ice cream
  //   Frozen vegetables
  //   Other frozen products
  //   Cooking oils
  //   Lard
  //   Other fats
  //   Tofu
  //   Ethnic spices
  //   Regional ingredients
  //   Detergents
  //   Sanitizers
  //   Cleaning tools
  //   Napkins
  //   Paper towels
  //   Toilet paper
  //   Disposable items
  //   To-go Containers
  //   Cooking utensils
  //   Pots
  //   Pans
  //   Mixers
  //   Spirits
  //   Bar tools
  //   Coffee varieties
  //   Tea varieties
    
  //     Structure the response as the following: "Category"
  //     `
  //     //get product's category
  //     const response = await openai.completions.create({
  //       model: "gpt-3.5-turbo-instruct",
  //       prompt,
  //       temperature: 0.2,
  //       max_tokens: 500
  //     });
  //     console.log({productId: element?.product?.id, category: response?.choices[0].text.trim()})
  //       updateProductById(element?.product?.id, {category: response?.choices[0].text.trim()})
  //   }
  // }
};
/**
 * Get list by id
 * @param {ObjectId} listId
 * @returns {Promise<List>}
 */
const getListAnalysis = async (listId) => {
  const list = await getListById(listId);
  //group products into categories
  const categories = list?.listItems?.reduce((acc, element)=>{
    const category = element?.product?.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    const item = Object.assign({totalPrice: element?.totalPrice, price: element?.saleUnitQuantities[0].price?.price, quantity: element?.saleUnitQuantities[0].quantity, unit: element?.saleUnitQuantities[0]?.saleUnit?.unit},{product: element?.product})
    acc[category].push(item);
    return acc;
  },{});
  const categorizedList = [];
  // get categories into an array
  Object.keys(categories).forEach((key) => {
    const category = categories[key];
    categorizedList.push(category);
  })

const result = [];

for (let index = 0; index < categorizedList.length; index++) {
  const element = categorizedList[index];
  const products = element.map(({product})=> `${product?.vendor} ${product?.brand} ${product?.description} productNumber: ${product?.productNumber}`)
  console.log({products: products.join(',')})
  if(products.length > 1){
    // ask ai to group products into subcategories
      const subcategories = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: 'system', content: `Review and group these product items per one category for side by side comparison.  Structure the response as the following: ["<productNumbers separated by commas>"]
        `},
      
      {
        role: 'user',
        content: `${products.join()}`
      }],
        temperature: 0.2,
        max_tokens: 150,
        n: 1
      });

      const productGroups = JSON.parse(subcategories?.choices[0].message.content)[0].split(",").map((item) => item.trim());
      const productsInfo = element.map(({product, totalPrice, price, unit, quantity})=> `productNumber: ${product?.productNumber} $${price}/${unit}, ${product?.packSize}/${unit}, Qty: ${quantity}, Total $${totalPrice}`)
      // ask ai to recommend one out of the subcategory
      const recommendation = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role: 'system', content: `Take this product category and analyze it to identify specific similar products to compare side by side, and make a recommendation on which product to purchase base on the info provided.
        Here is the subcategories of the products:.  Structure the response as the following: ["<recommendedProductNumber>", "<20 words or less reason why it's recommended>"]
        `},
      
      {
        role: 'user',
        content: `${productsInfo.join()}`
      }],
        temperature: 0.2,
        max_tokens: 150,
        n: 1
      });
      const recommendedProduct = JSON.parse(recommendation?.choices[0].message.content);
      // group items per subcategory and flag recommended one.
      const items = element
      .filter((item) => productGroups.find(text => item.product.productNumber.includes(text)))
      .map((item) => ({
        ...item,
        recommended: recommendedProduct[0] === item.product.productNumber,
        recommendedReason:  recommendedProduct[0] === item.product.productNumber ? recommendedProduct[1] : '' 
      }))
      result.push(items)
  } else {
    result.push(element)
  }
}
  return result;
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
