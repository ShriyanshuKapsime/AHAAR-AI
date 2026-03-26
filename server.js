// ============================================
// AHAAR — Clinical Decision Support System
// Base Express Server
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve Static Frontend ────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ───────────────────────────────────
// TODO: Mount API routes here
// const apiRoutes = require('./src/routes/api');
// app.use('/api', apiRoutes);

// ── MongoDB Connection ───────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ahaar';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// ── Start Server ─────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AHAAR server running on http://localhost:${PORT}`);
});
