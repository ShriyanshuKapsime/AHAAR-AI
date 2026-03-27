const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 1. Middleware ---
app.use(cors());
app.use(express.json());

// --- 2. Static Files ---
// Serves your dashboard, login, and css from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. API Routes ---
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/api'));
app.use('/api/user', require('./src/routes/user'));
app.use('/api/nutrition', require('./src/routes/nutrition'));

// --- 4. Catch-all Route (SPA Support) ---
// Uses a Regex literal to avoid the Express 5 PathError
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ahaar';
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// --- 6. 🔥 THE RENDER FIX: Port Binding ---
// process.env.PORT is provided by Render (usually 10000)
const PORT = process.env.PORT || 5000;

// Binding to '0.0.0.0' allows the server to accept external connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
