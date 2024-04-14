const mysql = require('mysql2/promise');
require("dotenv").config();
const moment = require('moment-timezone');
const TelegramBot = require('node-telegram-bot-api');

const express = require('express');
const app = express()
const port = 8080;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})

const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const MAX_ATTEMPTS = 3;

const MESSAGES = {
    verifyPrompt: 'Будь ласка, введіть /verify, щоб почати процес верифікації.',
    maxAttemptReached: 'Ви досягли максимальної кількості спроб верифікації. Будь ласка, спробуйте пізніше.',
    welcome: 'Ласкаво просимо! Будь ласка, надайте правильну відповідь, щоб продовжити: ',
    incorrectResponse: (attempts, maxAttempts) => `Неправильна відповідь. Спроба ${attempts} від ${maxAttempts}. Будь ласка, надайте правильну відповідь, щоб продовжити: `,
    verificationComplete: 'Ви пройшли верифікацію! Ви можете брати участь у чаті.',
    startVerification: 'Будь ласка, введіть /verify, щоб почати перевірку.',

    captcha: 'Скільки буде 2 + 2?',
    captchaAnswer: '4'
};

const CAPTCHAS = [
    { id: "1", question: "Скільки буде, якщо до 2 додати 14?", answer: "16" },
    { id: "2", question: "Скільки буде половина від 100?", answer: "50" },
    { id: "3", question: "Помножте 4 на 3", answer: "12" },
    { id: "4", question: "Розділіть 20 на 5", answer: "4" },
    { id: "5", question: "Чому дорівнює сума чисел 14 і 29?", answer: "43" }
];

const USERS_TABLE_NAME = process.env.NODE_ENV === 'production' ? 'users' : 'users_test';


function getRandomCaptcha() {
    const randomIndex = Math.floor(Math.random() * CAPTCHAS.length);
    return CAPTCHAS[randomIndex];
}


async function verifyUser(userId, username) {
    try {
        const [rows] = await pool.query(`SELECT verified, attempts, last_attempt, current_captcha_id, current_captcha_answer FROM ${USERS_TABLE_NAME} WHERE userId = ?`, [userId]);
        if (rows.length === 0) {
            const captcha = getRandomCaptcha();
            await pool.query(`INSERT INTO ${USERS_TABLE_NAME} (userId, verified, username, attempts, last_attempt, current_captcha_id, current_captcha_answer) VALUES (?, FALSE, ?, 0, NULL, ?, ?)`, [userId, username, captcha.id, captcha.answer]);
            return { verified: false, allowed: true, attempts: 0, captcha: captcha.question, answer: captcha.answer };
        }
        let user = rows[0];
        if (user.verified) {
            return { verified: true, allowed: true, attempts: user.attempts, captcha: null };
        } else {
            const lastAttemptTime = moment(user.last_attempt).tz('UTC').toDate(); // Converts database time to UTC
            const now = moment().utc().toDate(); // Current time in UTC
            const timeDiff = (now.getTime() - lastAttemptTime.getTime()) / 1000 / 60;

            if (timeDiff && timeDiff > (60 + 180)) { // 3h difference with the database
                await pool.query(`UPDATE ${USERS_TABLE_NAME} SET attempts = 0 WHERE userId = ?`, [userId]);
                user.attempts = 0;  // Reset attempts after the timeout period
            }

            if (user.attempts > MAX_ATTEMPTS) {
                return { verified: false, allowed: false, attempts: user.attempts, captcha: null };
            }

            const captcha = user.current_captcha_id ? CAPTCHAS.find(c => c.id === user.current_captcha_id) : getRandomCaptcha();
            const updateResult = await pool.query(`UPDATE ${USERS_TABLE_NAME} SET attempts = ?, last_attempt = NOW(), current_captcha_id = ?, current_captcha_answer = ?  WHERE userId = ?`, [++user.attempts, captcha.id, captcha.answer, userId]);
            if (updateResult && updateResult[0].affectedRows > 0) {
                // Return the incremented attempts only if the update was successful
                return { verified: false, allowed: true, attempts: user.attempts, captcha: captcha.question, answer: captcha.answer };
            }
        }
    } catch (error) {
        console.error('Error in verifyUser:', error);
        throw error;
    }
}



async function setUserVerified(userId) {
    try {
        await pool.query(`UPDATE ${USERS_TABLE_NAME} SET verified = TRUE WHERE userId = ?`, [userId]);
    } catch (error) {
        console.error('Error in setUserVerified:', error);
        throw error;
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;
    const username = msg.from.username || null;

    try {
        const { verified, allowed, attempts, captcha, answer } = await verifyUser(userId, username);

        if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
            if (!verified) {
                // Delete the message from the group
                bot.deleteMessage(chatId, msg.message_id.toString()).catch(error => {
                    console.error('Failed to delete message:', error);
                });

                if (allowed) {
                    bot.sendMessage(userId, MESSAGES.verifyPrompt);
                } else {
                    bot.sendMessage(userId, MESSAGES.maxAttemptReached);
                }
                return;
            }
        }

        if (msg.chat.type === 'private') {
            if (!verified) {
                if (!allowed) {
                    bot.sendMessage(chatId, MESSAGES.maxAttemptReached);
                    return;
                }
                // Handle '/verify' command specifically to start or restart the CAPTCHA challenge
                if (messageText === '/verify') {
                    console.log(`Prompting CAPTCHA for ${username}`);
                    bot.sendMessage(chatId, MESSAGES.welcome + captcha);
                    return;
                }
                // Handle CAPTCHA response
                if (messageText.match(/^\d+$/)) {
                    if (messageText === answer) {
                        console.log(`${username} answers CAPTCHA correctly`);
                        await setUserVerified(userId);
                        bot.sendMessage(chatId, MESSAGES.verificationComplete);
                    } else {
                        console.log(`Prompting CAPTCHA for ${username} again due to incorrect response`);
                        let newCaptcha = getRandomCaptcha(); // show a new CAPTCHA in case of wrong answer
                        await pool.query(`UPDATE ${USERS_TABLE_NAME} SET current_captcha_id = ?, current_captcha_answer = ? WHERE userId = ?`, [newCaptcha.id, newCaptcha.answer, userId]);
                        
                        bot.sendMessage(chatId, MESSAGES.incorrectResponse(attempts, MAX_ATTEMPTS) + newCaptcha.question);
                    }
                } else {
                    bot.sendMessage(chatId, MESSAGES.startVerification);
                }
            } else {
                bot.sendMessage(userId, MESSAGES.verificationComplete);
            }
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
    }
});
