const express = require('express');
require("dotenv").config({ override: true });
const path = require('path');

require('./services/botService');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const port = process.env.PORT || 8080;

let eventsExecutionDate = null;
let newsExecutionDate = null;
let newsDigestExecutionDate = null;
let vacanciesExecutionDate = null;
let wordExecutionDate = null;
let slangExecutionDate = null;
let weekendExecutionDate = null;

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
app.post('/news', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (newsExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        newsExecutionDate = today;

        await botService.postNews();
        res.status(200).send('News posted successfully');
    } catch (error) {
        console.error('Error posting news:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/news-digest', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (newsDigestExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        newsDigestExecutionDate = today;

        await botService.postNewsDigest();
        res.status(200).send('News digest posted successfully');
    } catch (error) {
        console.error('Error posting news digest:', error);
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

app.post('/slang-of-the-day', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (slangExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        slangExecutionDate = today;

        await botService.postSlangOfTheDay();
        res.status(200).send('Slang of the day posted successfully');
    } catch (error) {
        console.error('Error posting slang of the day:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/weekend-events', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (weekendExecutionDate === today) {
            return res.status(429).send('Exceeded execution threshold');
        }
        weekendExecutionDate = today;

        await botService.postWeekendEvents();
        res.status(200).send('Events posted successfully');
    } catch (error) {
        console.error('Error posting weekend events:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});