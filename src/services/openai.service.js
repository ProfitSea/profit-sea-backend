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
}

module.exports = OpenAiService;
