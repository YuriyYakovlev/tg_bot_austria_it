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

async function getChatSettings(chatId) {
    try {
        const [rows] = await db.query(
            'SELECT chatId, title, language, requiresVerification FROM chat_settings WHERE chatId = ?',
            [chatId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching chat settings:', error);
        return null;
    }
}

async function isThematicChat(chatId) {
    const settings = await getChatSettings(chatId);
    // default to TRUE if not defined
    return settings?.requiresVerification !== 0;
}
  

module.exports = {
    getLanguageForChat,
    isThematicChat,
    getChatSettings
};