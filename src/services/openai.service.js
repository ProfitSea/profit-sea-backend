const OpenAI = require('openai');
const config = require('../config/config');

class OpenAiService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openAi.key,
    });
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
    const recommendedProductArray = recommendedProduct.split('\n');
    const recommendedProductObject = {};

    recommendedProductArray.forEach((elem) => {
      const [key, value] = elem.split(': ');
      if (key && value) {
        const keyWithoutSpaces = key.trim().replace(/\s+/g, '_').toLowerCase();
        switch (true) {
          case keyWithoutSpaces.includes('vendor'):
            recommendedProductObject['vendor'] = value.trim();
            break;
          case keyWithoutSpaces.includes('id'):
            recommendedProductObject['productId'] = value.trim();
            break;
          case keyWithoutSpaces.includes('product'):
            recommendedProductObject['product'] = value.trim();
            break;
          case keyWithoutSpaces.includes('savings'):
            recommendedProductObject['priceSavings'] = value.trim();
            break;
          case keyWithoutSpaces.includes('reason'):
            recommendedProductObject['suggestionReason'] = value.trim();
            break;
          // Add more cases if needed
        }
      }
    });
    return recommendedProductObject;
  }
}

module.exports = OpenAiService;
