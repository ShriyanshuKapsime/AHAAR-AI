const rawData = require("../data/food.json");

const DEBUG = false;

function normalize(name) {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
}

function safeNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  return Number(value);
}

const FOOD_MAP = {};

for (let item of rawData) {
  const name = normalize(item.food_name);
  if (!name) continue;

  FOOD_MAP[name] = {
    originalName: item.food_name,
    nutrients: {
      calories: safeNumber(item.energy_kcal),
      protein: safeNumber(item.protein_g),
      iron: safeNumber(item.iron_mg),
      zinc: safeNumber(item.zinc_mg),
      magnesium: safeNumber(item.magnesium_mg),
      folate: safeNumber(item.folate_ug || item.vitb9_ug),
      vitaminD:
        safeNumber(item.vitd2_ug) + safeNumber(item.vitd3_ug)
    }
  };
}

function getFood(name) {
  name = normalize(name);
  if (!name) return null;

  const words = name.split(" ");
  let bestMatch = null;
  let bestScore = -Infinity;

  for (let key in FOOD_MAP) {
    let score = 0;
    const keyWords = key.split(" ");

    let matchedWords = 0;

    if (key === name) score += 10;

    for (let word of words) {
      if (keyWords.includes(word)) {
        score += 2;
        matchedWords++;
      }
    }

    const coverage = matchedWords / words.length;
    if (coverage < 0.7) continue;

    if (key.includes(name)) score += 3;

    const extraWords = keyWords.length - words.length;
    if (extraWords > 0) score -= extraWords;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = FOOD_MAP[key];
    }
  }

  if (!bestMatch || bestScore < 4) return null;

  return bestMatch;
}

function calculateDish(ingredients) {
  let total = {};

  for (let item of ingredients) {
    if (
      !item ||
      typeof item.name !== "string" ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0
    ) continue;

    const food = getFood(item.name);
    if (!food) continue;

    const factor = item.quantity / 100;

    if (DEBUG) {
      console.log(`${item.name} | ${item.quantity}g | x${factor}`);
    }

    for (let nutrient in food.nutrients) {
      const value = food.nutrients[nutrient] * factor;
      total[nutrient] = (total[nutrient] || 0) + value;
    }
  }

  // ✅ PATCH ADDED HERE (safe, no side effects)
  if (Object.keys(total).length === 0) {
    return { error: "No valid ingredients" };
  }

  return round(total);
}

function round(obj) {
  let out = {};
  for (let key in obj) {
    out[key] = Number(obj[key].toFixed(2));
  }
  return out;
}

module.exports = {
  calculateDish
};
