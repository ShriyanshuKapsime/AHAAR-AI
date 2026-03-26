const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchFromAI(foodName) {
  // Tweaked prompt to be slightly more strict
  const prompt = `Give nutritional values for "${foodName}" in JSON format. Include keys: calories, protein, zinc, magnesium, iron, folate, vitaminD. Output ONLY a valid JSON object. No explanation.`;

  try {
    const res = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0, // Low temperature for more deterministic output
      response_format: { type: "json_object" } // 🔥 FORCES JSON MODE
    });

    let rawContent = res.choices[0].message.content;
    
    // 🛡️ Safety Net: Extract everything from the first '{' to the last '}'
    const startIndex = rawContent.indexOf('{');
    const endIndex = rawContent.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON object found in the AI response string.");
    }
    
    let cleanJson = rawContent.substring(startIndex, endIndex + 1);

    return JSON.parse(cleanJson);
  } catch (err) {
    console.error(`❌ AI failed for [${foodName}]:`, err.message);
    // fallback safe return
    return { calories: 0, protein: 0, zinc: 0, magnesium: 0, iron: 0, folate: 0, vitaminD: 0 };
  }
}

module.exports = { fetchFromAI };
