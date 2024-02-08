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
  const openAiService = new OpenAiService();
  const list = await getListById(listId);
  // console.log({ list });
  //group products into categories
  const categories = list?.listItems?.reduce((acc, element) => {
    const category = element?.product?.category;
    if (!category) return acc;
    if (!acc[category]) {
      acc[category] = [];
    }

    // console.log({ category });
    // console.log({ acc });
    // console.log({ element });
    const item = Object.assign(
      {
        totalPrice: element?.totalPrice,
        price: element?.saleUnitQuantities[0].price?.price,
        quantity: element?.saleUnitQuantities[0].quantity,
        unit: element?.saleUnitQuantities[0]?.saleUnit?.unit,
      },
      { product: element?.product }
    );
    // console.log({ item });

    acc[category].push(item);
    return acc;
  }, {});

  // console.log('typeof categories');
  // console.log(typeof categories);
  // console.log({ categoriesLenght: categories.length });
  console.log('1. group products into categories ');
  console.log({ categories });
  console.log('');
  const categorizedList = Object.values(categories);

  // console.log('categorizedList.length)');
  // console.log({ categorizedList });
  // console.log('categorizedList[0]');
  // console.log(categorizedList[0]);
  // console.warn('categorizedList.length: ', categorizedList.length);
  // console.log(typeof categorizedList);
  // console.log(categorizedList[0][0]);

  const result = [];
  for (let index = 0; index < categorizedList.length; index++) {
    const productsByCategory = categorizedList[index];
    const products = productsByCategory.map(({ product }) => {
      // console.log('vendor: ', product?.vendor);
      // console.log('brand: ', product?.brand);
      // console.log('description: ', product?.description);
      // console.log('productNumber: ', product?.productNumber);
      return `${product?.vendor} <> ${product?.brand} <> ${product?.description} <> productNumber: ${product?.productNumber}`;
    });

    // console.log({ products });
    // console.log({ products: products.join('|') });
    console.log({ products });
    if (products.length > 1) {
      // ask ai to group products into subcategories
      const openAiService = new OpenAiService();
      console.log('2. ask ai to group products into subcategories');
      const productGroups = await openAiService.getSubCategories(products);
      console.log({ subCategories: productGroups });
      console.log('');

      const productsInfo = productsByCategory.map(
        ({ product, totalPrice, price, unit, quantity }) =>
          `productNumber: ${product?.productNumber} $${price}/${unit}, ${product?.packSize}/${unit}, Qty: ${quantity}, Total $${totalPrice}`
      );
      // ask ai to recommend one out of the subcategory
      console.log({ productsInfo });
      console.log(productsInfo.join());
      console.log('');

      console.log('3. ask ai to recommend one out of the subcategory');
      const recommendedProduct = await openAiService.getRecomendation(productsInfo.join());
      console.log({ recommendedProduct });
      console.log('');

      // group items per subcategory and flag recommended one.
      console.log('4. group items per subcategory and flag recommended one.');

      const items = productsByCategory
        .filter((item) =>
          productGroups.find((text) => {
            console.log({ text });
            return item.product.productNumber.includes(text);
          })
        )
        .map((item) => ({
          ...item,
          recommended: recommendedProduct[0] === item.product.productNumber,
          recommendedReason: recommendedProduct[0] === item.product.productNumber ? recommendedProduct[1] : '',
        }));
      result.push(items);

      console.log({ result });
      console.log('');
    } else {
      result.push(productsByCategory);
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
  getListAnalysis,
};
