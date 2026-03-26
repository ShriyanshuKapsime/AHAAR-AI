const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

const SECRET = process.env.JWT_SECRET || "secret";

// ===== SIGNUP =====
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, SECRET, {
      expiresIn: "7d"
    });

    // ADDED: New users definitely don't have a profile yet
    res.json({ token, hasProfile: false });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup error" });
  }
});

// ===== LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, SECRET, {
      expiresIn: "7d"
    });

    // ADDED: Check if the user has a profile in the database
    const profile = await UserProfile.findOne({ userId: user._id });
    const hasProfile = !!profile; // Converts to true if found, false if not

    // Return the token, profile status, and persisted physical profile fields
    res.json({
      token,
      hasProfile,
      user: profile
        ? {
            name: profile.name,
            height: profile.height,
            weight: profile.weight,
            age: profile.age,
            gender: profile.gender,
            activity: profile.activity
          }
        : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});

module.exports = router;
