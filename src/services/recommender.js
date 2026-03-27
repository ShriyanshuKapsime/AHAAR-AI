const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🔥 Added 'isShuffle' parameter to force brand new, creative ideas
async function getSmartSuggestions(meal, lowNutrients, profile = {}, isShuffle = false) {
    if (lowNutrients.length === 0) {
        return {
            symptoms: "Your current intake is perfectly aligning with your biological needs today.",
            short: "Great job! Keep up this balanced eating.",
            details: []
        };
    }

    const weight = profile.weight || 65;
    const activity = profile.activity || "Moderate";
    const age = profile.age || 25;

    // 🔥 The Shuffle Directive: Forces the AI to abandon basic answers
    const shuffleRule = isShuffle 
        ? "SHUFFLE MODE IS ACTIVE: You MUST provide COMPLETELY DIFFERENT tweaks than standard advice. Do not just suggest Paneer or simple Sprouts again. Think of unique, lesser-known seeds, specific nuts, or unique regional add-ons." 
        : "";

    const prompt = `
    You are AHAAR, an empathetic, highly knowledgeable AI Clinical Nutritionist. 
    
    USER BIOLOGY: ${age} years old, ${weight}kg, Activity Level: ${activity}.
    USER ATE: "${meal}"
    NUTRITIONAL GAPS: ${lowNutrients.join(", ")}

    Your goal is to act as a supportive, personalized health coach.
    1. Tone: Warm, direct, and clinical but easy to understand.
    2. Symptoms: Identify 1-2 subtle symptoms they might feel based on their specific body weight/activity level if these gaps continue.
    3. TWEAKS, NOT NEW MEALS: Suggest 2-3 STRICTLY VEGETARIAN Indian "Add-ons" or "Tweaks" to the EXACT meal they just ate.
    
    CRITICAL RULE: Suggest only Vegetarian items. No meat, fish, or eggs.
    ${shuffleRule}

    Return ONLY a JSON object:
    {
      "symptoms": "A warm, empathetic warning about symptoms (e.g., fatigue during workouts) if gaps continue.",
      "short": "A friendly, one-sentence summary of the exact tweak to make.",
      "details": [
        {"nutrient": "Nutrient Name", "suggestion": "Specific VEG food item", "reason": "Why this specific food fits perfectly with what they just ate"}
      ]
    }
    `;

    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            // 🔥 Higher temperature on shuffle makes the AI much more creative
            temperature: isShuffle ? 0.8 : 0.3 
        });
        return JSON.parse(res.choices[0].message.content);
    } catch (err) {
        console.error("Recommender AI Error:", err);
        return { 
            symptoms: "Prolonged deficiency may lead to reduced energy levels during your daily activities.",
            short: "Consider adding sprouts or seeds to balance your meal.", 
            details: [{ nutrient: "General", suggestion: "Mixed Sprouts", reason: "Adds quick fiber and protein." }] 
        };
    }
}

// 🔥 Added 'isShuffle' here as well
async function getTomorrowMealPlan(lowNutrients, profile = {}, currentMeal = "", isShuffle = false) {
    const gaps = lowNutrients.length > 0 ? lowNutrients.join(", ") : "General Health";
    const activity = profile.activity || "Moderate";
    
    // 🔥 The Shuffle Directive for Meals
    const shuffleRule = isShuffle 
        ? "SHUFFLE MODE IS ACTIVE: DO NOT suggest standard Dal, Paneer, or Poha. Provide COMPLETELY UNIQUE, lesser-known, highly creative regional Indian veg dishes. Think outside the box!" 
        : "";

    const prompt = `
    You are AHAAR, an empathetic AI Clinical Nutritionist.
    
    USER PROFILE: Activity Level: ${activity}.
    MISSING NUTRIENTS TODAY: ${gaps}.
    WHAT THEY ATE TODAY: "${currentMeal}" 

    Generate a 3-meal STRICTLY VEGETARIAN Indian plan for tomorrow.
    
    RULES FOR PERSONALIZATION:
    1. NO MEAT, NO FISH, NO EGGS.
    2. DYNAMIC REGIONAL DIET: Analyze what they ate today ("${currentMeal}"). If it sounds South Indian, suggest a South Indian recovery plan. If North Indian, suggest North Indian. Match their local palate!
    3. ACTIVITY MATCH: If they are highly active, suggest protein-heavy recovery meals. If sedentary, keep the meals lighter but nutrient-dense.
    4. Keep it realistic for a home-cooked Indian diet.
    ${shuffleRule}
    
    Return ONLY JSON:
    {
      "meals": [
        {"type": "Breakfast", "dish": "Name of dynamic regional Veg dish", "benefit": "How it fixes ${gaps} and fits their activity level"},
        {"type": "Lunch", "dish": "Name of dynamic regional Veg dish", "benefit": "How it fixes ${gaps}"},
        {"type": "Dinner", "dish": "Name of dynamic regional Veg dish", "benefit": "How it fixes ${gaps}"}
      ]
    }
    `;

    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            // 🔥 Boost creativity on shuffle
            temperature: isShuffle ? 0.8 : 0.4 
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