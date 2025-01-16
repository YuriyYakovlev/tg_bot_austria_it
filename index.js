const express = require('express');
require("dotenv").config({ override: true });
require('./services/botService');

const app = express();
const port = process.env.PORT || 8080;

let lastExecutionDate = null;

// Endpoint for scheduled events
const botService = require('./services/botService');
app.post('/scheduled-events', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (lastExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        lastExecutionDate = today;

        await botService.postUpcomingEvents();
        res.status(200).send('Events posted successfully');
    } catch (error) {
        console.error('Error posting events:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/news-digest', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (lastExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        lastExecutionDate = today;

        await botService.postNewsDigest();
        res.status(200).send('News posted successfully');
    } catch (error) {
        console.error('Error posting news:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});