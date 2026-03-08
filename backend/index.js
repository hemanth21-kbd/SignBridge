require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

console.log("Gemini API Key loaded:", process.env.GEMINI_API_KEY ? "Yes (starts with " + process.env.GEMINI_API_KEY.substring(0, 5) + "...)" : "No");


const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'signbridge_secret_123';

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword], function (err) {
            if (err) return res.status(400).json({ error: 'Email already exists' });
            res.status(201).json({ message: 'User registered successfully!' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

// History: Save Translation
app.post('/api/history', (req, res) => {
    const { userId, text, type } = req.body;
    db.run(`INSERT INTO history (userId, text, type) VALUES (?, ?, ?)`, [userId, text, type], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'History saved' });
    });
});

// History: Get Translations
app.get('/api/history/:userId', (req, res) => {
    const { userId } = req.params;
    db.all(`SELECT * FROM history WHERE userId = ? ORDER BY timestamp DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Translation: Gemini Vision API (Process frames)
app.post('/api/translate/video', async (req, res) => {
    try {
        const { frames } = req.body; // Array of base64 image strings

        if (!frames || frames.length === 0) {
            return res.status(400).json({ error: 'No video frames provided.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
        }

        // Initialize Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Map frames to Gemini's expected format
        const imageParts = frames.map(frameBase64 => {
            // Remove the data URI preamble if it exists (e.g., "data:image/jpeg;base64,")
            const base64Data = frameBase64.replace(/^data:image\/\w+;base64,/, "");
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };
        });

        // The prompt describes the goal
        const prompt = "You are an expert at reading sign language. These are sequential frames from a video of a person performing a single sign language gesture or sentence. Analyze the movement and hand shapes carefully. What is the meaning? ONLY output the translated text. Do not output any formatting, just the words.";

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        let text = response.text().trim();
        
        // Remove markdown or quotes if any, just to be safe
        text = text.replace(/[\*\"]/g, '');

        res.json({ text });

    } catch (err) {
        console.error("Gemini API Error Detail: ", err);
        res.status(500).json({ error: 'Failed to translate video.', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
