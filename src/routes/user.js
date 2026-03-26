const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const UserProfile = require("../models/UserProfile");

// ===== SAVE / UPDATE PROFILE =====
router.post("/onboarding", auth, async (req, res) => {
  try {
    await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { upsert: true, new: true }
    );

    res.json({ message: "Saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Onboarding error" });
  }
});

// ===== GET PROFILE =====
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "No profile" });
    }

    res.json(profile);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch error" });
  }
});

module.exports = router;
