// backend/server.js
const express = require('express');
require('dotenv').config();
const path = require('path');
const cors = require('cors');
// const aria = require('aria');  <-- REMOVED THIS LINE

const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static route to serve uploaded files (optional)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => res.json({ msg: 'API up' }));

app.get('/download-guide', (req, res) => {
    const fileUrl = "https://api.cloudinary.com/v1_1/dkgcjhrnv/image/download?api_key=337742628965437&attachment=true&public_id=user_guide_roq6fz";

    res.redirect(fileUrl);
});

app.listen(port, () => console.log(`Server running on port ${port}`));

