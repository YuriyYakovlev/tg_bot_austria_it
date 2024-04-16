//verificationService.js
const db = require('../db/connectors/dbConnector');
const config = require('../config/config');
const moment = require('moment-timezone');

const verifiedUsersCache = {};

async function verifyUser(userId, username) {
    // Check if the user is cached and verified
    if (verifiedUsersCache[userId]) {
        return verifiedUsersCache[userId];
    }

    try {
        const [rows] = await db.query(`SELECT verified, attempts, last_attempt, current_captcha_id, current_captcha_answer FROM ${config.USERS_TABLE_NAME} WHERE userId = ?`, [userId]);
        if (rows.length === 0) {
            const captcha = getRandomCaptcha();
            await db.query(`INSERT INTO ${config.USERS_TABLE_NAME} (userId, verified, username, attempts, last_attempt, current_captcha_id, current_captcha_answer) VALUES (?, FALSE, ?, 0, NULL, ?, ?)`, [userId, username, captcha.id, captcha.answer]);
            return { verified: false, allowed: true, attempts: 0, captcha: captcha.question, answer: captcha.answer };
        }
        let user = rows[0];
        if (user.verified) {
            verifiedUsersCache[userId] = {
                verified: true,
                allowed: true,
                attempts: user.attempts,
                captcha: null
            };
            return verifiedUsersCache[userId];
        } else {
            const lastAttemptTime = moment(user.last_attempt).tz('UTC').toDate(); // Converts database time to UTC
            const now = moment().utc().toDate(); // Current time in UTC
            const timeDiff = (now.getTime() - lastAttemptTime.getTime()) / 1000 / 60;

            if (timeDiff && timeDiff > (60 + 180)) { // 3h difference with the database
                await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET attempts = 0 WHERE userId = ?`, [userId]);
                user.attempts = 0;  // Reset attempts after the timeout period
            }

            if (user.attempts > config.MAX_ATTEMPTS) {
                return { verified: false, allowed: false, attempts: user.attempts, captcha: null };
            }

            const captcha = user.current_captcha_id ? config.captchas.find(c => c.id === user.current_captcha_id) : getRandomCaptcha();
            const updateResult = await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET attempts = ?, last_attempt = NOW(), current_captcha_id = ?, current_captcha_answer = ?  WHERE userId = ?`, [++user.attempts, captcha.id, captcha.answer, userId]);
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
        await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET verified = TRUE WHERE userId = ?`, [userId]);
        verifiedUsersCache[userId] = {
            verified: true,
            allowed: true,
            attempts: 0,
            captcha: null
        };
    } catch (error) {
        console.error('Error in setUserVerified:', error);
        throw error;
    }
}

function getRandomCaptcha() {
    const randomIndex = Math.floor(Math.random() * config.captchas.length);
    return config.captchas[randomIndex];
}

module.exports = {
    verifyUser,
    setUserVerified,
    getRandomCaptcha
};
