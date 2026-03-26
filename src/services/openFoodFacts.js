const axios = require("axios");

async function fetchFromOpenFoodFacts(foodName) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&json=1`;

    const res = await axios.get(url);

    const product = res.data.products?.[0];
    if (!product) return null;

    const n = product.nutriments || {};

    return {
      calories: n["energy-kcal_100g"] || 0,
      protein: n["proteins_100g"] || 0,
      zinc: n["zinc_100g"] || 0,
      magnesium: n["magnesium_100g"] || 0,
      iron: n["iron_100g"] || 0,
      folate: n["folates_100g"] || 0,
      vitaminD: n["vitamin-d_100g"] || 0
    };

  } catch (err) {
    console.log("⚠️ OpenFoodFacts failed, switching to AI...");
    return null; // 🔥 IMPORTANT
  }
}

module.exports = { fetchFromOpenFoodFacts };
