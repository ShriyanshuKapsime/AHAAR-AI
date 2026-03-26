// ============================================
// AHAAR — Extractor Agent Test Runner
// Run: node src/testExtractor.js
// ============================================

require('dotenv').config();
const { extractFoodItems, foodLookup, allowedKeys } = require('./agents/extractor');

// ── Test Sentences ───────────────────────────
const testCases = [
  {
    label: 'Test 1: Simple roti + dal combo',
    input: 'I had 2 wheat rotis and a bowl of dal makhani for lunch'
  },
  {
    label: 'Test 2: Chai + snack with unknown item',
    input: 'Had a cup of garam chai with 3 pieces of samosa and a packet of kurkure'
  },
  {
    label: 'Test 3: Full thali with cooking methods',
    input: 'I ate fried rice, one katori of rajma, boiled eggs, and a glass of lassi for dinner'
  }
];

// ── Runner ───────────────────────────────────
async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  🧪 AHAAR EXTRACTOR — TEST SUITE');
  console.log('═══════════════════════════════════════════');
  console.log(`📊 Food lookup loaded: ${allowedKeys.length} keys\n`);

  for (const tc of testCases) {
    console.log('───────────────────────────────────────────');
    console.log(`🏷️  ${tc.label}`);
    console.log(`📝 Input: "${tc.input}"`);
    console.log('───────────────────────────────────────────');

    try {
      const result = await extractFoodItems(tc.input);
      console.log('\n📋 PARSED RESULT:');
      console.log(JSON.stringify(result, null, 2));

      // Validate matched keys against lookup
      let validCount = 0;
      let invalidCount = 0;
      for (const food of result.foods) {
        if (foodLookup[food.key]) {
          validCount++;
          console.log(`   ✅ "${food.key}" → ${foodLookup[food.key].food_name} (${foodLookup[food.key].energy_kcal} kcal/100g)`);
        } else {
          invalidCount++;
          console.log(`   ❌ "${food.key}" → NOT FOUND in lookup!`);
        }
      }

      console.log(`\n   📊 Score: ${validCount} valid, ${invalidCount} invalid, ${result.unrecognized_items.length} unrecognized`);

      if (validCount > 0 && invalidCount === 0) {
        console.log('   💎 PASS\n');
      } else if (validCount > 0) {
        console.log('   ⚠️  PARTIAL PASS\n');
      } else {
        console.log('   ❌ FAIL\n');
      }
    } catch (err) {
      console.error(`   ❌ ERROR: ${err.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════');
  console.log('  🏁 ALL TESTS COMPLETE');
  console.log('═══════════════════════════════════════════');
}

runTests();
