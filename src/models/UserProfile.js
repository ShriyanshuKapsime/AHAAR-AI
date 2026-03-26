const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },

  name: String,
  height: Number,
  weight: Number,
  age: Number,
  gender: String,
  activity: String
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);
