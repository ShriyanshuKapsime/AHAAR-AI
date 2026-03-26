const { loadDB, saveDB } = require("../utils/db");
const { fetchFromOpenFoodFacts } = require("../services/openFoodFacts");
const { fetchFromAI } = require("../services/aiFetcher");

// Standardizes strings: "Chapati/Roti" -> "chapati roti", "wheat-roti" -> "wheat roti"
function normalize(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[-_/]/g, " ") // 🔥 Handles hyphens, underscores, AND slashes!
    .replace(/[^a-z\s]/g, "") // Remove remaining special characters
    .replace(/\s+/g, " ") // Clean up extra spaces
    .trim();
}

// 🧠 The Ultimate Bidirectional Fuzzy Matcher
function findLocalFuzzy(foodName, db) {
  const normalizedSearch = normalize(foodName);
  if (!normalizedSearch) return null;

  const searchWords = normalizedSearch.split(" ");
  let bestMatch = null;
  let bestScore = 0;

  for (const item of db) {
    const dbItemName = normalize(item.food_name || item.name);
    if (!dbItemName) continue;

    // 1. Instant Perfect Match
    if (dbItemName === normalizedSearch) {
      return item;
    }

    let score = 0;

    // 2. Direct Substring Bypass (e.g., DB has "roti", AI searches "wheat roti")
    // If one string is completely inside the other, give it an instant 80% score.
    if (dbItemName.includes(normalizedSearch) || normalizedSearch.includes(dbItemName)) {
      score = Math.max(score, 0.8);
    }

    // 3. Word Overlap Match (e.g., AI "wheat roti" vs DB "chapati roti")
    const dbWords = dbItemName.split(" ");
    let matchedWords = 0;

    for (const word of searchWords) {
      if (dbWords.includes(word)) matchedWords++;
    }

    // Check coverage from BOTH directions
    const searchCoverage = matchedWords / searchWords.length; 
    const dbCoverage = matchedWords / dbWords.length;         
    
    // Take the highest overlap score
    const overlapScore = Math.max(searchCoverage, dbCoverage);
    score = Math.max(score, overlapScore);

    // 4. The Magic Threshold (0.45 catches 1-out-of-2 word matches!)
    if (score > bestScore && score >= 0.45) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

async function getNutrition(foodName) {
  const db = loadDB();
  const normalized = normalize(foodName);
  
  // 1. Local Search (using the upgraded Fuzzy Matcher)
  let food = findLocalFuzzy(normalized, db);
  
  if (food) {
    console.log(`✅ Found locally in DB: ${food.food_name || food.name}`);
    
    // Standardize the return format so it works seamlessly with both ICMR and AI data
    return {
      calories: Number(food.energy_kcal || food.calories || 0),
      protein: Number(food.protein_g || food.protein || 0),
      iron: Number(food.iron_mg || food.iron || 0),
      zinc: Number(food.zinc_mg || food.zinc || 0),
      magnesium: Number(food.magnesium_mg || food.magnesium || 0),
      folate: Number(food.folate_ug || food.vitb9_ug || food.folate || 0),
      vitaminD: Number(food.vitd2_ug || food.vitd3_ug || food.vitaminD || 0)
    };
  }

  console.log(`🌐 [${foodName}] not in local DB. Fetching from API...`);
  let data = await fetchFromOpenFoodFacts(normalized);

  // 2. Fallback AI
  if (!data || Object.values(data).every(v => v === 0)) {
    console.log(`🤖 Using AI fallback for [${foodName}]...`);
    data = await fetchFromAI(normalized);
  }

  const isValid = data && Object.values(data).some(v => v && v !== 0);

  // 3. Cache the new data back to the DB for next time
  if (isValid) {
    db.push({ name: foodName, ...data });
    saveDB(db);
    console.log(`💾 Saved [${foodName}] to DB for future caching.`);
  } else {
    console.log("⚠️ Skipping save (invalid data)");
  }
  
  return data;
}

module.exports = { getNutrition };
