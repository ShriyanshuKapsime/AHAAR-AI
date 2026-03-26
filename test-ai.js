// test-ai.js
require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function runTest() {
    console.log("🚀 Bypassing Google - Testing OpenAI Key...");

    const mockInput = "I had 2 fried bhaturas with a 200g bowl of chole, and a raw cucumber salad on the side.";
    console.log(`📝 User Input: "${mockInput}"`);
    console.log("⏳ Waiting for GPT-4o-mini to parse...");

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }, // Forces strict JSON output
            messages: [
                {
                    role: "system",
                    content: `You are an advanced clinical data extraction AI for an Indian nutrition app.
                    Extract every food item mentioned and break it down into three specific data points.
                    1. dish_name: Normalize to standard English/Hindi (e.g., "rotis" -> "wheat roti").
                    2. quantity: The weight, volume, or count (e.g., "200g", "2 pieces", "1 bowl"). If not mentioned, output "unknown".
                    3. cooking_method: How it was cooked (e.g., "fried", "boiled", "roasted", "raw"). Infer from the dish name if obvious.
                    
                    Output ONLY a valid JSON object containing an array called "extracted_foods".
                    Example: { "extracted_foods": [ { "dish_name": "chole", "quantity": "200g", "cooking_method": "boiled" } ] }`
                },
                {
                    role: "user",
                    content: mockInput
                }
            ]
        });

        console.log("\n--- 🧠 OPENAI NLP RESULT ---");
        // Parse and cleanly print the result
        const resultJson = JSON.parse(response.choices[0].message.content);
        console.log(JSON.stringify(resultJson, null, 2));
        console.log("----------------------------\n");
        console.log("✅ SUCCESS! Your OpenAI engine is live.");

    } catch (error) {
        console.error("🚨 FAILURE:", error.message);
    }
}

runTest();