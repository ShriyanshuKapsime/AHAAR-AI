const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/api'));

// DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ahaar')
  .then(() => console.log("DB connected"))
  .catch(err => console.error(err));

// Server
app.listen(5000, () => console.log("Server running on 5000"));
