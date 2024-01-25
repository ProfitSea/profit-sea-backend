const OpenAI = require('openai');
const config = require('../config/config');

class OpenAiService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openAi.key,
    });
  }

  async getProductCategory(brand, description) {
    const prompt = `Tell me under which category does this product ${brand} ${description} fall under
      Categories:
        Meat and Poultry
        Seafood
        Produce
        Dairy and Cheese
        Bakery
        Grains and Staples
        Canned and Jarred Goods
        Condiments
        Beverages
        Frozen Foods
        Cooking Essentials(oil, lard, fats)
        Disposable Items
        Kitchen Tools and Utensils
      Structure the response as the following: "Category"
    `;
    //get product's category
    const response = await this.openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt,
      temperature: 0.2,
      max_tokens: 500,
    });
    return response?.choices[0].text.trim();
  }

  async getSubCategories(products) {
    const subcategories = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          // content: `Review and group these product items per one category for side by side comparison.  Structure the response as the following: ["<productNumbers separated by commas>"]
          content: `Review and group these product items per one category for side by side comparison. Treat the product numbers as numerical values. Structure the response as the following: ["productNumbers separated by commas"]"]
      `,
        },

        {
          role: 'user',
          content: `${products.join()}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
      n: 1,
    });
    // console.log('subcategories?.choices[0]!--------------:');
    // console.log({ subcategories });
    // console.log({ subcategories: subcategories?.choices[0].message.content });
    const productGroups = JSON.parse(subcategories?.choices[0].message.content)[0]
      .split(',')
      .map((item) => item.trim());
    return productGroups;
  }

  async getRecomendation(productsInfo) {
    const recommendation = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Take this product category and analyze it to identify specific similar products to compare side by side, and make a recommendation on which product to purchase base on the info provided.
      Here is the subcategories of the products:.  Structure the response as the following: ["<recommendedProductNumber>", "<20 words or less reason why it's recommended, include savings>"]
      `,
        },

        {
          role: 'user',
          content: `${productsInfo}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
      n: 1,
    });
    const recommendedProduct = JSON.parse(recommendation?.choices[0].message.content);
    // console.log({ recommendation });
    // console.log({ recommendedProduct });
    return recommendedProduct;
  }
}

module.exports = OpenAiService;
