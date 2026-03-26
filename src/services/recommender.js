const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getSmartSuggestions(meal, lowNutrients) {
    if (lowNutrients.length === 0) {
        return {
            symptoms: "Your current intake is meeting clinical thresholds for these markers.",
            short: "Great job! This meal is nutritionally balanced.",
            details: []
        };
    }

    const prompt = `
    User ate: "${meal}"
    Nutritional Gaps detected: ${lowNutrients.join(", ")}

    As an Indian Clinical Nutritionist:
    1. Identify 2-3 specific symptoms associated with these deficiencies.
    2. Suggest 2-3 STRICTLY VEGETARIAN Indian "Add-ons" (No meat, No fish, No eggs).
    
    CRITICAL RULE: Suggest only Vegetarian items like Paneer, Soya, Sprouts, Curd, Nuts, or specific Dals.

    Return ONLY a JSON object:
    {
      "symptoms": "A short warning about symptoms (e.g., fatigue, low immunity) if these gaps continue.",
      "short": "A one-sentence summary of what to add.",
      "details": [
        {"nutrient": "Nutrient Name", "suggestion": "Specific VEG food item", "reason": "Why this pairing works with the meal"}
      ]
    }
    `;

    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2
        });
        return JSON.parse(res.choices[0].message.content);
    } catch (err) {
        console.error("Recommender AI Error:", err);
        return { 
            symptoms: "Prolonged deficiency may lead to reduced energy levels.",
            short: "Consider adding sprouts or curd to balance your meal.", 
            details: [{ nutrient: "General", suggestion: "Mixed Sprouts", reason: "Adds fiber and protein to any Indian meal." }] 
        };
    }
}

async function getTomorrowMealPlan(lowNutrients) {
    const gaps = lowNutrients.length > 0 ? lowNutrients.join(", ") : "General Health";
    
    const prompt = `
    Today the user was low on: ${gaps}.
    Generate a 3-meal STRICTLY VEGETARIAN Indian plan (Breakfast, Lunch, Dinner) for tomorrow.
    
    RULES:
    1. NO MEAT, NO FISH, NO EGGS.
    2. Focus on high-protein/high-mineral veg sources (Soya, Paneer, Rajma, Chana, Palak).
    3. Keep it realistic for a home-cooked Indian diet.
    
    Return ONLY JSON:
    {
      "meals": [
        {"type": "Breakfast", "dish": "Name of Veg dish", "benefit": "How it fixes ${gaps}"},
        {"type": "Lunch", "dish": "Name of Veg dish", "benefit": "How it fixes ${gaps}"},
        {"type": "Dinner", "dish": "Name of Veg dish", "benefit": "How it fixes ${gaps}"}
      ]
    }
    `;

    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        return JSON.parse(res.choices[0].message.content);
    } catch (err) {
        console.error("Meal Plan Error:", err);
        return { meals: [
            {type: "Breakfast", dish: "Poha with Peanuts", benefit: "Iron and healthy fats"},
            {type: "Lunch", dish: "Dal Tadka & Rice", benefit: "Complete protein profile"},
            {type: "Dinner", dish: "Paneer Bhurji & Roti", benefit: "High protein recovery"}
        ] };
    }
}

module.exports = { getSmartSuggestions, getTomorrowMealPlan };
