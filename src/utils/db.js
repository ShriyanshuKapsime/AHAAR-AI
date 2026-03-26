const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/food.json");

function loadDB() {
  // FIX 1: Check if file exists to prevent server crashes
  if (!fs.existsSync(DB_PATH)) {
    // Check if the /data folder exists, if not, create it
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Create an empty JSON array file
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
    return [];
  }

  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("⚠️ Corrupted food.json, returning empty array");
    return [];
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { loadDB, saveDB };
