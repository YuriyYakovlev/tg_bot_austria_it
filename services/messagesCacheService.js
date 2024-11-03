//messagesCacheService.js
const db = require("../db/connectors/dbConnector");

async function cacheUserMessage(userId, chatId, messageId, text) {
  try {
    await db.query(
      `INSERT INTO cached_messages (userId, chatId, messageId, msg_text) VALUES (?, ?, ?, ?)`,
      [userId, chatId, messageId, text]
    );
    //console.log(`Cached message for user ${userId}`);
  } catch (error) {
    console.error(`Error caching message for user ${userId}:`, error);
  }
}

async function retrieveCachedMessages(userId) {
  try {
    const [rows] = await db.query(
      `SELECT chatId, messageId, msg_text FROM cached_messages WHERE userId = ?`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error(
      `Error retrieving cached messages for user ${userId}:`,
      error
    );
    return [];
  }
}

async function deleteCachedMessage(messageId) {
  try {
    await db.query(`DELETE FROM cached_messages WHERE messageId = ?`, [
      messageId,
    ]);
    //console.log(`Deleted cached message ${messageId}`);
  } catch (error) {
    console.error(`Error deleting cached message ${messageId}:`, error);
  }
}

module.exports = {
  cacheUserMessage,
  retrieveCachedMessages,
  deleteCachedMessage
};
