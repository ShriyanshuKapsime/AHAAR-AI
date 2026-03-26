// src/agents/extractor.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractFoodData(userInput) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    You are an advanced clinical data extraction AI for an Indian nutrition app.
    User Input: "${userInput}"

    Extract every food item mentioned and break it down into three specific data points.
    1. dish_name: Normalize to standard English/Hindi (e.g., "rotis" -> "wheat roti").
    2. quantity: The weight, volume, or count (e.g., "200g", "2 pieces", "1 bowl"). If not mentioned, output "unknown".
    3. cooking_method: How it was cooked (e.g., "fried", "boiled", "roasted", "raw"). Infer from the dish name if obvious (e.g., "paneer tikka" -> "grilled/roasted", "salad" -> "raw"). If completely unknown, output "standard".
    
    Output ONLY a valid JSON array of objects. No markdown, no explanations.
    
    Example Output:
    [
      {
        "dish_name": "wheat roti",
        "quantity": "2 pieces",
        "cooking_method": "roasted"
      },
      {
        "dish_name": "dal makhani",
        "quantity": "1 bowl",
        "cooking_method": "boiled/simmered"
      }
    ]
    `;

    try {
        const result = await model.generateContent(prompt);
        const extractedFoods = JSON.parse(result.response.text());
        return extractedFoods;
    } catch (error) {
        console.error("🚨 NLP Extraction Failed:", error.message);
        return [];
    }
}

module.exports = { extractFoodData };   