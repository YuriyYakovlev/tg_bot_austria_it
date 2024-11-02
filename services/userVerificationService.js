//userVerificationService.js
const db = require('../db/connectors/dbConnector');
const chatSettingsService = require('./chatSettingsService');
const languageService = require('./languageService');
const config = require('../config/config');
const moment = require('moment-timezone');

const verifiedUsersCache = {};
const recentUserCaptchas = {};
const exceptionalUsernames = process.env.EXCEPTIONAL_USERNAMES ? process.env.EXCEPTIONAL_USERNAMES.split(',').map(name => name.trim()) : [];
const exceptionalFullNames = process.env.EXCEPTIONAL_FULL_NAMES ? process.env.EXCEPTIONAL_FULL_NAMES.split(',').map(name => name.trim()) : [];


async function verifyUser(chatId, userId, username, firstName, lastName) {
    // exceptional cases
    const fullName = `${firstName} ${lastName}`.trim();
    if (exceptionalUsernames.includes(username) || exceptionalFullNames.includes(fullName)) {
        console.log(`Verification false for exceptional user: ${userId}`);
        return { verified: false, allowed: false, attempts: 0, captcha: null };
    }

    // Check if the user is cached and verified
    if (verifiedUsersCache[userId]) {
        return verifiedUsersCache[userId];
    }

    try {
        const [rows] = await db.query(`SELECT verified, attempts, last_attempt, current_captcha_id, current_captcha_answer, is_spammer, first_name, last_name FROM ${config.USERS_TABLE_NAME} WHERE userId = ?`, [userId]);
        if (rows.length === 0) {
            const captcha = getRandomCaptcha(userId);
            await db.query(`INSERT INTO ${config.USERS_TABLE_NAME} (chatId, userId, verified, username, attempts, last_attempt, current_captcha_id, current_captcha_answer, first_name, last_name) VALUES (?, ?, FALSE, ?, 0, NULL, ?, ?, ?, ?)`, [chatId, userId, username, captcha.id, captcha.answer, firstName, lastName]);
            return { verified: false, allowed: true, attempts: 0, captcha: captcha.question, answer: captcha.answer };
        } else {
            // temporary, to update already existing users
            if((firstName && !rows[0].first_name) || (lastName && !rows[0].last_name))   {
                await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET first_name = ?, last_name = ? WHERE userId = ?`, [firstName, lastName, userId]);
            }
        }
        
        let user = rows[0];
        if (user.verified && !user.is_spammer) {  
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

            if ((user.attempts > config.MAX_ATTEMPTS) || user.is_spammer) {
                return { verified: false, allowed: false, attempts: user.attempts, captcha: null };
            }

            const language = await chatSettingsService.getLanguageForChat(chatId);
            const captchas = languageService.getMessages(language).captchas;

            const captcha = user.current_captcha_id ? captchas.find(c => c.id === user.current_captcha_id) : getRandomCaptcha(userId);
            const updateResult = await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET attempts = ?, last_attempt = NOW(), current_captcha_id = ?, current_captcha_answer = ?  WHERE userId = ?`, [++user.attempts, captcha.id, captcha.answer, userId]);
            if (updateResult && updateResult[0].affectedRows > 0) {
                // Return the incremented attempts only if the update was successful
                return { verified: false, allowed: true, attempts: user.attempts, captcha: captcha.question, answer: captcha.answer };
            }
        }
    } catch (error) {
        console.error('Error in verifyUser:', error);
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
    }
}

async function updateUserCaptcha(userId, newCaptcha) {
    try {
        await db.query(
            `UPDATE ${config.USERS_TABLE_NAME} SET current_captcha_id = ?, current_captcha_answer = ? WHERE userId = ?`,
            [newCaptcha.id, newCaptcha.answer, userId]
        );
    } catch (error) {
        console.error('Error in setUserVerified:', error);
    }
}

async function resetUserVerification(userId) {
    try {
        const result = await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET verified = FALSE, attempts = 0 WHERE userId = ?`, [userId]);
        if (result.affectedRows > 0) {
            console.log(`Verification status reset for user ID: ${userId}`);
            // Optionally clear any cached verification status if applicable
            if (verifiedUsersCache[userId]) {
                verifiedUsersCache[userId] = {
                    verified: false,
                    allowed: true,
                    attempts: 0,
                    captcha: null
                };
            }
        }
    } catch (error) {
        console.error(`Failed to reset verification for user ID ${userId}:`, error);
    }
}

async function getRandomCaptcha(chatId, userId) {
    const language = await chatSettingsService.getLanguageForChat(chatId);
    const captchas = languageService.getMessages(language).captchas;

    const recentCaptchas = recentUserCaptchas[userId] || [];
    const availableCaptchas = captchas.filter(captcha => !recentCaptchas.includes(captcha.id));
    const randomCaptcha = availableCaptchas[Math.floor(Math.random() * availableCaptchas.length)];
    await updateRecentCaptchasForUser(chatId, userId, randomCaptcha.id);
    return randomCaptcha;
}

async function updateRecentCaptchasForUser(chatId, userId, newCaptchaId) {
    if (!recentUserCaptchas[userId]) {
        recentUserCaptchas[userId] = [];
    }

    recentUserCaptchas[userId].push(newCaptchaId);

    const language = await chatSettingsService.getLanguageForChat(chatId);
    const captchas = languageService.getMessages(language).captchas;

    if (recentUserCaptchas[userId].length > captchas.length) {
        recentUserCaptchas[userId].shift();  // Remove the oldest CAPTCHA to maintain the limit
    }
}

module.exports = {
    verifyUser,
    setUserVerified,
    getRandomCaptcha,
    updateUserCaptcha,
    resetUserVerification
};
