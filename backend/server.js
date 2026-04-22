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

const https = require('https');

const axios = require('axios');

app.get('/download-guide', async (req, res) => {
    try {
        const fileUrl = "https://res.cloudinary.com/dkgcjhrnv/image/upload/v1776801073/user_guide_roq6fz.pdf";

        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', 'attachment; filename="ASAG_User_Guide.pdf"');
        res.setHeader('Content-Type', 'application/pdf');

        response.data.pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).send("Download failed");
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));

