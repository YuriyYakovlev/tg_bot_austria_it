const express = require('express');
require("dotenv").config({ override: true });
require('./services/botService');

const app = express();
const port = process.env.PORT || 8080;

let eventsExecutionDate = null;
let newsExecutionDate = null;
let vacanciesExecutionDate = null;
let wordExecutionDate = null;
// Endpoint for scheduled events
const botService = require('./services/botService');
app.post('/scheduled-events', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (eventsExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        eventsExecutionDate = today;

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
        if (newsExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        newsExecutionDate = today;

        await botService.postNewsDigest();
        res.status(200).send('News posted successfully');
    } catch (error) {
        console.error('Error posting news:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/new-vacancies', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (vacanciesExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        vacanciesExecutionDate = today;

        await botService.postNewVacancies();
        res.status(200).send('New vacancies posted successfully');
    } catch (error) {
        console.error('Error posting new vacancies:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/word-of-the-day', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (wordExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        wordExecutionDate = today;

        await botService.postWordOfTheDay();
        res.status(200).send('Word of the day posted successfully');
    } catch (error) {
        console.error('Error posting word of the day:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});