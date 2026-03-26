// ============================================
// AHAAR — User Model (Shell)
// ============================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // TODO: Define user schema fields
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
