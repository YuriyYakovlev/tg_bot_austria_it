// chatSettingsService.js
const db = require('../db/connectors/dbConnector');
const languageCache = {};

async function getLanguageForChat(chatId) {
    if (languageCache[chatId]) {
        return languageCache[chatId];
    }

    try {
        const [rows] = await db.query('SELECT language FROM chat_settings WHERE chatId = ?', [chatId]);
        const language = rows.length > 0 ? rows[0].language : 'en';
        languageCache[chatId] = language;
        
        return language;
    } catch (error) {
        console.error('Error fetching language for chat:', error);
        return 'en';
    }
}

module.exports = {
    getLanguageForChat
};