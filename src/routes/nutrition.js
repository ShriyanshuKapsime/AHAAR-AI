const express = require('express');
const router = express.Router();

const { extractFoodData } = require('../agents/extractor');
const { getNutrition } = require('../agents/nutritionAgent');
const { getSmartSuggestions, getTomorrowMealPlan } = require('../services/recommender');

router.post('/analyze', async (req, res) => {
    try {
        const { meal, profile } = req.body;

        // 1. Agentic Extraction (Groq/LLM)
        const extractedFoods = await extractFoodData(meal);

        // 2. Fetch Live Data & Calculate Totals
        let mealTotals = { calories: 0, protein: 0, iron: 0, zinc: 0, magnesium: 0, folate: 0, vitaminD: 0 };

        for (const food of extractedFoods) {
            const name = (food.name || "").replace(/_/g, " ");
            const factor = (food.quantity || 100) / 100;

            const liveNutritionData = await getNutrition(name);
            
            if (liveNutritionData) {
                Object.keys(mealTotals).forEach(key => {
                    mealTotals[key] += (liveNutritionData[key] || 0) * factor;
                });
            }
        }

        // 3. Dynamic RDA Calculation (No longer hardcoded)
        const weight = Number(profile?.weight) || 65;
        const height = Number(profile?.height) || 170;
        const age = Number(profile?.age) || 25;
        const gender = profile?.gender || "Male";
        const activity = profile?.activity || "Sedentary";

        // Calories & Protein
        let BMR = gender === "Male" ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;
        let actMultiplier = activity.includes("3-5") ? 1.55 : (activity.includes("6-7") ? 1.725 : 1.2);
        let recCalories = BMR * actMultiplier;
        let recProtein = weight * (activity.includes("6-7") ? 2.0 : 1.2);

        // Dynamic Micros (Indian RDA Guidelines)
        let recIron = gender === "Male" ? 19 : (age > 50 ? 19 : 29);
        let recZinc = gender === "Male" ? 17 : 13.2;
        let recMagnesium = gender === "Male" ? 440 : 370;
        let recFolate = 400;
        let recVitaminD = 15;

        const percentages = {
            protein: Math.min(100, Math.round((mealTotals.protein / recProtein) * 100)),
            iron: Math.min(100, Math.round((mealTotals.iron / recIron) * 100)),
            zinc: Math.min(100, Math.round((mealTotals.zinc / recZinc) * 100)),
            magnesium: Math.min(100, Math.round((mealTotals.magnesium / recMagnesium) * 100)),
            folate: Math.min(100, Math.round((mealTotals.folate / recFolate) * 100)),
            vitaminD: Math.min(100, Math.round((mealTotals.vitaminD / recVitaminD) * 100)),
            calories: Math.min(100, Math.round((mealTotals.calories / recCalories) * 100))
        };

        // 4. Identify Gaps (< 60%)
        const lowNutrients = Object.keys(percentages)
            .filter(key => key !== 'calories' && percentages[key] < 60)
            .map(key => key.charAt(0).toUpperCase() + key.slice(1));

        // 5. Call AI for Dynamic Clinical Insights & Meal Plan
        const smartRecommendation = await getSmartSuggestions(meal, lowNutrients);
        const mealPlan = await getTomorrowMealPlan(lowNutrients);

       res.json({
            raw: mealTotals,
            percentages,
            // 🔥 THE FIX: Group your 'rec' variables into the exact RDA object the frontend needs!
            rda: {
                calories: Math.round(recCalories),
                protein: Math.round(recProtein),
                iron: recIron,
                zinc: recZinc,
                magnesium: recMagnesium,
                folate: recFolate,
                vitaminD: recVitaminD
            },
            insight: smartRecommendation.symptoms, 
            recommendation: smartRecommendation,
            mealPlan: mealPlan.meals,
            lowNutrients
        });

    } catch (error) {
        console.error("🚨 Route Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * Retry Route for regenerating the meal plan specifically
 */
router.post('/regen-plan', async (req, res) => {
    try {
        const mealPlan = await getTomorrowMealPlan(req.body.lowNutrients || []);
        res.json({ mealPlan: mealPlan.meals });
    } catch (e) {
        res.status(500).json({ error: "Regen failed" });
    }
});

module.exports = router;
