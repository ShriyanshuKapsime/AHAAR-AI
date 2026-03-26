const express = require('express');
const router = express.Router(); // 🔥 This fixes the "router is not defined" error

// Import your agents and services
const { extractFoodData } = require('../agents/extractor');
const { getNutrition } = require('../agents/nutritionAgent');
const { getSmartSuggestions, getTomorrowMealPlan } = require('../services/recommender');

// 1. The main Analysis Route
router.post('/analyze', async (req, res) => {
    try {
        const { meal, profile } = req.body;

        // Step A: Extract Items & Weights
        const extractedFoods = await extractFoodData(meal);

        // Step B: Calculate Totals
        const formattedIngredients = [];
        let mealTotals = { calories: 0, protein: 0, iron: 0, zinc: 0, magnesium: 0, folate: 0, vitaminD: 0 };

        for (const food of extractedFoods) {
            const name = (food.name || "").replace(/_/g, " ");
            const quantity = food.quantity || 100;
            const factor = quantity / 100;

            const liveNutritionData = await getNutrition(name);
            
            if (liveNutritionData) {
                Object.keys(mealTotals).forEach(key => {
                    mealTotals[key] += (liveNutritionData[key] || 0) * factor;
                });
            }
            formattedIngredients.push({ name, quantity });
        }

        // Step C: Calculate Personal RDA (Keep your original BMR logic)
        const weight = Number(profile?.weight) || 65;
        const height = Number(profile?.height) || 170;
        const age = Number(profile?.age) || 25;
        const gender = profile?.gender || "Male";
        const activity = profile?.activity || "Sedentary Lifestyle (0-2 days a week)";

        let BMR = gender === "Male" ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;
        let actMultiplier = activity.includes("3-5") ? 1.55 : (activity.includes("6-7") ? 1.725 : 1.2);
        let recCalories = BMR * actMultiplier;
        let recProtein = weight * (activity.includes("3-5") ? 1.5 : (activity.includes("6-7") ? 2.0 : 1.2));
        
        // Base RDA values
        const rda = { calories: recCalories, protein: recProtein, iron: 18, zinc: 12, magnesium: 340, folate: 400, vitaminD: 15 };

        const percentages = {
            protein: Math.min(100, Math.round((mealTotals.protein / rda.protein) * 100)),
            iron: Math.min(100, Math.round((mealTotals.iron / rda.iron) * 100)),
            zinc: Math.min(100, Math.round((mealTotals.zinc / rda.zinc) * 100)),
            magnesium: Math.min(100, Math.round((mealTotals.magnesium / rda.magnesium) * 100)),
            folate: Math.min(100, Math.round((mealTotals.folate / rda.folate) * 100)),
            vitaminD: Math.min(100, Math.round((mealTotals.vitaminD / rda.vitaminD) * 100)),
            calories: Math.min(100, Math.round((mealTotals.calories / rda.calories) * 100))
        };

        // Step D: Identify Deficiencies
        const lowNutrients = Object.keys(percentages)
            .filter(key => key !== 'calories' && percentages[key] < 60)
            .map(key => key.charAt(0).toUpperCase() + key.slice(1));

        // Step E: Call AI Agents for Symptoms and Recommendations
        const smartRecommendation = await getSmartSuggestions(meal, lowNutrients);
        const mealPlan = await getTomorrowMealPlan(lowNutrients);

        // Send response back to dashboard
        res.json({
            raw: mealTotals,
            percentages,
            rda,
            insight: smartRecommendation.symptoms, // 🔥 This maps to the clinical insight box
            recommendation: smartRecommendation,
            mealPlan: mealPlan.meals,
            lowNutrients // For the retry button
        });

    } catch (error) {
        console.error("🚨 Route Error:", error);
        res.status(500).json({ message: "Server error during analysis" });
    }
});

// 2. 🔥 The Regen-Plan Route (The Retry Button)
router.post('/regen-plan', async (req, res) => {
    try {
        const { lowNutrients } = req.body;
        // Fallback to general health if no gaps detected yet
        const gaps = lowNutrients && lowNutrients.length > 0 ? lowNutrients : ["Protein", "Iron"];
        const mealPlan = await getTomorrowMealPlan(gaps);
        res.json({ mealPlan: mealPlan.meals });
    } catch (error) {
        console.error("🚨 Regen Error:", error);
        res.status(500).json({ error: "Failed to regenerate plan" });
    }
});

module.exports = router;
