// src/agents/extractor.js
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractFoodData(userInput) {
  console.log(`🧠 [Groq Agent] Analyzing: "${userInput}"`);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a clinical data extraction AI for an Indian nutrition app. 
                    Extract food items and ESTIMATE their weight in grams based on standard Indian portion sizes.

                    RULES:
                    1. NORMALIZATION: Convert food names to snake_case (e.g., "Dal Makhani" -> "dal_makhani").
                    2. QUANTITY ESTIMATION: You MUST calculate the total estimated weight in grams. 
                       - 1 standard roti = ~40g. So "3 rotis" = 120g.
                       - 1 bowl of dal = ~150g.
                       - 1 burger = ~200g.
                       - 1 plate of rice = ~200g.
                    3. Output a JSON object with a key "foods" containing an array of objects.
                    
                    Example Input: "I had 2 chapatis and a bowl of dal"
                    Example Output: {"foods": [{"name": "wheat_roti", "quantity": 80}, {"name": "dal_makhani", "quantity": 150}]}
                    
                    Example Input: "I ate 1 burger"
                    Example Output: {"foods": [{"name": "burger", "quantity": 200}]}`
        },
        { role: "user", content: userInput }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.0,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;

    let extractedFoods = [];
    try {
      const parsed = JSON.parse(responseText);
      extractedFoods = parsed.foods || Object.values(parsed)[0] || [];
    } catch (e) {
      console.error("Failed to parse Groq JSON:", responseText);
    }

    console.log("✅ Groq Extracted & Weighed:", extractedFoods);
    return extractedFoods;

  } catch (error) {
    console.error("🚨 Groq Extraction Failed:", error.message);
    return [];
  }
}

module.exports = { extractFoodData };