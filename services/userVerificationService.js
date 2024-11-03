//userVerificationService.js
const db = require('../db/connectors/dbConnector');
const chatSettingsService = require('./chatSettingsService');
const languageService = require('./languageService');
const config = require('../config/config');

const verifiedUsersCache = {};
const recentUserCaptchas = {};
const userAttempts = {};
const exceptionalUsernames = process.env.EXCEPTIONAL_USERNAMES ? process.env.EXCEPTIONAL_USERNAMES.split(',').map(name => name.trim()) : [];
const exceptionalFullNames = process.env.EXCEPTIONAL_FULL_NAMES ? process.env.EXCEPTIONAL_FULL_NAMES.split(',').map(name => name.trim()) : [];


async function verifyUser(chatId, userId, username, firstName, lastName) {
    // exceptional cases
    const fullName = `${firstName} ${lastName}`.trim();
    if (exceptionalUsernames.includes(username) || exceptionalFullNames.includes(fullName)) {
        console.log(`Verification false for exceptional user: ${userId}`);
        return { verified: false };
    }

    // Check if the user is cached and verified
    if (verifiedUsersCache[userId]) {
        return verifiedUsersCache[userId];
    }

    try {
        const [rows] = await db.query(`SELECT verified, spam FROM ${config.USERS_TABLE_NAME} WHERE userId = ?`, [userId]);
        if (rows.length === 0) {
            await db.query(`INSERT INTO ${config.USERS_TABLE_NAME} (chatId, userId, verified) VALUES (?, ?, FALSE)`, [chatId, userId]);
            return { verified: false };
        }
        
        let user = rows[0];
        if (user.verified && !user.spam) {  
            verifiedUsersCache[userId] = { verified: true };
            return verifiedUsersCache[userId];
        } else {
            return { verified: false };
        }
    } catch (error) {
        console.error('Error in verifyUser:', error.message);
        return { verified: false };
    }
}

async function setUserVerified(userId) {
    try {
        await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET verified = TRUE WHERE userId = ?`, [userId]);
        verifiedUsersCache[userId] = { verified: true };
    } catch (error) {
        console.error('Error in setUserVerified:', error);
    }
}

async function resetUserVerification(userId) {
    try {
        const result = await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET verified = FALSE WHERE userId = ?`, [userId]);
        if (result.affectedRows > 0) {
            console.log(`Verification status reset for user ID: ${userId}`);
            // Optionally clear any cached verification status if applicable
            if (verifiedUsersCache[userId]) {
                verifiedUsersCache[userId] = { verified: false };
            }
        }
    } catch (error) {
        console.error(`Failed to reset verification for user ID ${userId}:`, error);
    }
}

async function getRandomCaptcha(userId, language = null, chatId = null) {
    if (!language && chatId) {
        language = await chatSettingsService.getLanguageForChat(chatId);
    }
    const captchas = languageService.getMessages(language).captchas;

    const recentCaptchas = recentUserCaptchas[userId] || [];
    const availableCaptchas = captchas.filter(captcha => !recentCaptchas.includes(captcha.id));
    const randomCaptcha = availableCaptchas[Math.floor(Math.random() * availableCaptchas.length)];
    await updateRecentCaptchasForUser(userId, randomCaptcha.id);
    return randomCaptcha;
}

async function getCaptchaAnswer(captchaId, language) {
    const captchas = languageService.getMessages(language).captchas;
    const captcha = captchas.find(c => c.id === captchaId);
    if (captcha) {
        return captcha.answer;
    } else {
        return null;
    }
}

async function updateRecentCaptchasForUser(userId, newCaptchaId) {
    if (!recentUserCaptchas[userId]) {
        recentUserCaptchas[userId] = [];
    }

    recentUserCaptchas[userId].push(newCaptchaId);
    const captchas = languageService.getMessages().captchas;

    if (recentUserCaptchas[userId].length > captchas.length) {
        recentUserCaptchas[userId].shift();  // Remove the oldest CAPTCHA to maintain the limit
    }
}

function recordUserAttempt(userId) {
    const now = Date.now();
    const HOUR_IN_MS = 60 * 60 * 1000;
    
    if (!userAttempts[userId]) {
        userAttempts[userId] = { count: 1, firstAttemptTime: now };
        return true;
    }

    const userRecord = userAttempts[userId];
    if (now - userRecord.firstAttemptTime < HOUR_IN_MS) {
        if (userRecord.count >= config.MAX_ATTEMPTS) {
            return false;
        }
        userRecord.count += 1;
        return true;
    } else {
        userRecord.count = 1;
        userRecord.firstAttemptTime = now;
        return true;
    }
}

function cleanupUserAttempts() {
    const now = Date.now();
    const HOUR_IN_MS = 60 * 60 * 1000;
    for (const userId in userAttempts) {
        if (now - userAttempts[userId].firstAttemptTime > HOUR_IN_MS) {
            delete userAttempts[userId];
        }
    }
}

module.exports = {
    verifyUser,
    setUserVerified,
    getRandomCaptcha,
    getCaptchaAnswer,
    resetUserVerification,
    recordUserAttempt,
    cleanupUserAttempts
};
