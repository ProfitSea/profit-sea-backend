const OpenAI = require('openai');
const config = require('../config/config');

class OpenAiService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openAi.key,
    });
  }

  static convertToJSON(dataString) {
    const lines = dataString.split('\n');

    const result = {};

    lines.forEach((line) => {
      const trimmedLine = line.replace(/^- /, '').trim();

      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine
        .substring(colonIndex + 1)
        .trim()
        .replace(/,$/, '');
      result[key] = value;
    });
    return result;
  }

  async getRecomendation(productsInfo) {
    const recommendation = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          content: `
          Analyze the cost-effectiveness based on the vendor, description, price per unit, and the pack size without considering quantity. Recommend which product is cheaper and suitable based on the pack size. 
          Provide the following formatted response:
          - vendorName: [Vendor Name]
          - priceSaving: [Exact savings only numbers with dollar sign]
          - itemId: [Cheapest item ID]
          - reason: [Concise reason within 20 words, include 'per unit' if referring to unit cost]
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
    const recommendedProduct = recommendation.choices[0].message.content;
    return OpenAiService.convertToJSON(recommendedProduct);
  }
}

module.exports = OpenAiService;
