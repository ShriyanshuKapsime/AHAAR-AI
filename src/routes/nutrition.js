const express = require('express');
const router = express.Router();

const { extractFoodData } = require('../agents/extractor');
const { getNutrition } = require('../agents/nutritionAgent');

router.post('/analyze', async (req, res) => {
    try {
        const { meal, profile } = req.body;

        // 1. Agentic Extraction (Groq/LLM)
        const extractedFoods = await extractFoodData(meal);

        // 2. Fetch Live Data & Calculate Totals Inline
        const formattedIngredients = [];
        let mealTotals = {
            calories: 0, protein: 0, iron: 0, zinc: 0,
            magnesium: 0, folate: 0, vitaminD: 0
        };

        for (const food of extractedFoods) {
            const name = (food.name || "").replace(/_/g, " ");
            const quantity = food.quantity || 100;
            const factor = quantity / 100; // e.g., 200g = 2x multiplier

            // 🔥 Get the live, freshly fuzzy-matched data directly from the agent
            const liveNutritionData = await getNutrition(name);
            
            if (liveNutritionData) {
                mealTotals.calories += (liveNutritionData.calories || 0) * factor;
                mealTotals.protein += (liveNutritionData.protein || 0) * factor;
                mealTotals.iron += (liveNutritionData.iron || 0) * factor;
                mealTotals.zinc += (liveNutritionData.zinc || 0) * factor;
                mealTotals.magnesium += (liveNutritionData.magnesium || 0) * factor;
                mealTotals.folate += (liveNutritionData.folate || 0) * factor;
                mealTotals.vitaminD += (liveNutritionData.vitaminD || 0) * factor;
            }

            formattedIngredients.push({ name, quantity });
        }

        // 3. Calculate Personal RDA
        const weight = Number(profile?.weight) || 65;
        const height = Number(profile?.height) || 170;
        const age = Number(profile?.age) || 25;
        const gender = profile?.gender || "Male";
        const activity = profile?.activity || "Sedentary Lifestyle (0-2 days a week)";

        // --- CALORIES ---
        let BMR = gender === "Male"
            ? (10 * weight) + (6.25 * height) - (5 * age) + 5
            : (10 * weight) + (6.25 * height) - (5 * age) - 161;

        let actMultiplier = 1.2;
        if (activity.includes("6-7")) actMultiplier = 1.725;
        else if (activity.includes("3-5")) actMultiplier = 1.55;

        let recCalories = BMR * actMultiplier;

        // --- PROTEIN ---
        let pFactor = 1.2;
        if (activity.includes("6-7")) pFactor = 2.0;
        else if (activity.includes("3-5")) pFactor = 1.5;
        let recProtein = weight * pFactor;

        // --- MICROS ---
        let recIron = 8;
        if (gender === "Male") {
            if (age <= 18) recIron = 11;
        } else {
            if (age <= 18) recIron = 15;
            else if (age <= 50) recIron = 18;
        }

        let recZinc = gender === "Male" ? 11 : 8;
        let recMagnesium = gender === "Male" ? 400 : 310;
        let recFolate = 400;
        let recVitaminD = 15;

        // 4. Calculate Percentages for the Dashboard Chart
        // Math.min(100, ...) ensures the radar chart doesn't break boundaries
        const percentages = {
            calories: Math.min(100, Math.round(((mealTotals.calories || 0) / recCalories) * 100)),
            protein: Math.min(100, Math.round(((mealTotals.protein || 0) / recProtein) * 100)),
            iron: Math.min(100, Math.round(((mealTotals.iron || 0) / recIron) * 100)),
            zinc: Math.min(100, Math.round(((mealTotals.zinc || 0) / recZinc) * 100)),
            magnesium: Math.min(100, Math.round(((mealTotals.magnesium || 0) / recMagnesium) * 100)),
            folate: Math.min(100, Math.round(((mealTotals.folate || 0) / recFolate) * 100)),
            vitaminD: Math.min(100, Math.round(((mealTotals.vitaminD || 0) / recVitaminD) * 100))
        };

        const deficitIron = Math.max(0, recIron - (mealTotals.iron || 0)).toFixed(1);

        let recommendation = "Your micronutrient vectors look good.";
        if (deficitIron > 5) {
            recommendation = `Iron Deficit (${deficitIron}mg missing). Consider adding vitamin C rich foods to boost absorption.`;
        }

        // 5. Send exact structure expected by dashboard.html
        res.json({
            raw: mealTotals,
            rda: {
                calories: Math.round(recCalories), 
                protein: Math.round(recProtein), 
                iron: recIron,
                zinc: recZinc, 
                magnesium: recMagnesium, 
                folate: recFolate, 
                vitaminD: recVitaminD
            },
            percentages,
            insight: `AI mapped & weighed: ${formattedIngredients.map(f => `${f.quantity}g of ${f.name}`).join(", ")}`,
            recommendation
        });

    } catch (error) {
        console.error("🚨 Route Error:", error);
        res.status(500).json({ message: "Server error during analysis" });
    }
});

module.exports = router;
