// src/routes/nutrition.js
const express = require('express');
const router = express.Router();

const { extractFoodData } = require('../agents/extractor');
const { calculateDish } = require('../engine/calculator');

router.post('/analyze', async (req, res) => {
    try {
        const { meal, profile } = req.body;

        // 1. Groq extraction
        const extractedFoods = await extractFoodData(meal);

        // 2. Format for Krish's Engine
        const formattedIngredients = extractedFoods.map(food => ({
            name: (food.name || "").replace(/_/g, " "),
            quantity: food.quantity || 100
        }));

        // 3. Run Krish's Calculator for Raw Values
        let mealTotals = calculateDish(formattedIngredients);
        if (mealTotals.error) {
            mealTotals = { calories: 0, protein: 0, iron: 0, zinc: 0, magnesium: 0, folate: 0, vitaminD: 0 };
        }

        // 4. Calculate Personal RDA (EXACTLY from ahaarapp3.js)
        const weight = Number(profile?.weight) || 65;
        const height = Number(profile?.height) || 170;
        const age = Number(profile?.age) || 25;
        const gender = profile?.gender || "Male";
        const activity = profile?.activity || "Sedentary Lifestyle (0-2 days a week)";

        // --- CALORIES (Mifflin-St Jeor Equation) ---
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

        // --- IRON ---
        let recIron = 8; // default
        if (gender === "Male") {
            if (age < 1) recIron = 11;
            else if (age <= 3) recIron = 7;
            else if (age <= 8) recIron = 10;
            else if (age <= 13) recIron = 8;
            else if (age <= 18) recIron = 11;
            else recIron = 8;
        } else {
            if (age < 1) recIron = 11;
            else if (age <= 3) recIron = 7;
            else if (age <= 8) recIron = 10;
            else if (age <= 13) recIron = 8;
            else if (age <= 18) recIron = 15;
            else if (age <= 50) recIron = 18;
            else recIron = 8;
        }

        // --- ZINC ---
        let recZinc = 8;
        if (gender === "Male") {
            if (age < 1) recZinc = 3;
            else if (age <= 3) recZinc = 3;
            else if (age <= 8) recZinc = 5;
            else if (age <= 13) recZinc = 8;
            else recZinc = 11;
        } else {
            if (age < 1) recZinc = 3;
            else if (age <= 3) recZinc = 3;
            else if (age <= 8) recZinc = 5;
            else if (age <= 13) recZinc = 8;
            else if (age <= 18) recZinc = 9;
            else recZinc = 8;
        }

        // --- MAGNESIUM ---
        let recMagnesium = 400;
        if (gender === "Male") {
            if (age < 1) recMagnesium = 75;
            else if (age <= 3) recMagnesium = 80;
            else if (age <= 8) recMagnesium = 130;
            else if (age <= 13) recMagnesium = 240;
            else if (age <= 18) recMagnesium = 410;
            else if (age <= 30) recMagnesium = 400;
            else recMagnesium = 420;
        } else {
            if (age < 1) recMagnesium = 75;
            else if (age <= 3) recMagnesium = 80;
            else if (age <= 8) recMagnesium = 130;
            else if (age <= 13) recMagnesium = 240;
            else if (age <= 18) recMagnesium = 360;
            else if (age <= 30) recMagnesium = 310;
            else recMagnesium = 320;
        }

        // --- FOLATE ---
        let recFolate = 400;
        if (age < 1) recFolate = 80;
        else if (age <= 3) recFolate = 150;
        else if (age <= 8) recFolate = 200;
        else if (age <= 13) recFolate = 300;
        else recFolate = 400;

        // --- VITAMIN D ---
        let recVitaminD = 15;
        if (age < 1) recVitaminD = 10;
        else if (age <= 70) recVitaminD = 15;
        else recVitaminD = 20;

        // 5. Calculate Percentages of RDA (Capped at 100% for the chart, or let it overflow)
        const percentages = {
            calories: Math.round(((mealTotals.calories || 0) / recCalories) * 100),
            protein: Math.round(((mealTotals.protein || 0) / recProtein) * 100),
            iron: Math.round(((mealTotals.iron || 0) / recIron) * 100),
            zinc: Math.round(((mealTotals.zinc || 0) / recZinc) * 100),
            magnesium: Math.round(((mealTotals.magnesium || 0) / recMagnesium) * 100),
            folate: Math.round(((mealTotals.folate || 0) / recFolate) * 100),
            vitaminD: Math.round(((mealTotals.vitaminD || 0) / recVitaminD) * 100)
        };

        const deficitIron = Math.max(0, recIron - (mealTotals.iron || 0)).toFixed(1);
        let recommendation = "Your micronutrient vectors look good. Maintain current habits.";
        if (deficitIron > 5) {
            recommendation = `Iron Deficit (${deficitIron}mg missing). Squeeze lemon over your next meal to boost non-heme iron absorption by 30%.`;
        }

        // 6. Send everything back
        res.json({
            raw: mealTotals,
            rda: { calories: recCalories, protein: recProtein, iron: recIron, zinc: recZinc, magnesium: recMagnesium, folate: recFolate, vitaminD: recVitaminD },
            percentages: percentages,
            insight: `AI mapped & weighed: ${formattedIngredients.map(f => `${f.quantity}g of ${f.name}`).join(", ")}`,
            recommendation: recommendation
        });

    } catch (error) {
        console.error("🚨 Route Error:", error);
        res.status(500).json({ message: "Server error during analysis" });
    }
});

module.exports = router;