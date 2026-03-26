
const express = require("express");
const router = express.Router();
const { calculateDish } = require("../engine/calculator");
const auth = require("../middleware/auth");

// PROTECTED ROUTE
router.post("/analyze", auth, (req, res) => {
  try {
    const { ingredients } = req.body;

    const result = calculateDish(ingredients);

    if (!result || Object.keys(result).length === 0) {
      return res.status(400).json({ error: "No valid ingredients" });
    }

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
