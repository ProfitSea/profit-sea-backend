const OpenAI = require('openai');
const config = require('../config/config');

class OpenAiService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openAi.key,
    });
  }

  async getProductCategory(brand, description) {
    const prompt = `Categorize the food item "${brand} ${description}" into one of the following categories:
      Meat and Poultry
      Seafood
      Produce
      Appetizers/Snacks
      Dairy and Cheese
      Bakery
      Grains and Staples
      Canned and Jarred Goods
      Condiments
      Beverages
      Frozen Foods
      Cooking Essentials (oil, lard, fats)
      Disposable Items
      Kitchen Tools and Utensils
      Coffee varieties
    Consider the primary ingredients and nature of the product, Structure the response as the following: "Category"
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
          content: `
            As a specialized tool for restaurant owners and managers, your role is to automate and optimize food supply cost analysis.
            When users provide real-time prices and product descriptions from various vendors, your task is to analyze, compare, and recommend the most economical options.
            Your responses should follow a structured format: Suggested product vendor name, Suggested Product name, Suggested product ID number, Price savings,
            and a concise Reason for the suggestion (200 characters or less). This functionality addresses challenges like price volatility and inconsistent pricing,
            aiming to enhance budgeting and operational efficiency. You're part of a broader objective to disrupt the food distribution market and promote transparency and efficiency, empowering restaurant owners in a competitive market.
            Please analyze the unit prices for each item and recommend the optimal choice.
            `,
          role: 'system',
        },

        {
          role: 'user',
          content: `${productsInfo}`,
        },
      ],
      temperature: 0,
      max_tokens: 150,
      n: 1,
    });

    const recommendedProduct = recommendation?.choices[0].message.content;
    return recommendedProduct;
  }
}

module.exports = OpenAiService;
