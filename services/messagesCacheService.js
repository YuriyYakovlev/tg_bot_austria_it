//messagesCacheService.js

//botService.js
const db = require("../db/connectors/dbConnector");

async function cacheUserMessage(userId, chatId, messageId, text) {
  try {
    await db.query(
      `INSERT INTO cached_messages (userId, chatId, messageId, messageText) VALUES (?, ?, ?, ?)`,
      [userId, chatId, messageId, text]
    );
    console.log(`Cached message for user ${userId}`);
  } catch (error) {
    console.error(`Error caching message for user ${userId}:`, error);
  }
}

async function retrieveCachedMessages(userId) {
  try {
    const [rows] = await db.query(
      `SELECT messageId, messageText FROM cached_messages WHERE userId = ?`,
      [userId]
    );
    // if (rows.length === 0) {
    //   console.log(`No cached messages found for user ${userId}`);
    // } else {
    //   console.log(
    //     `Retrieved ${rows.length} cached messages for user ${userId}`
    //   );
    // }
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

async function deleteOldCachedMessages() {
  try {
    const deleteOldNonSpam =
      "DELETE FROM cached_messages WHERE is_spam = FALSE AND messageDate <= NOW() - INTERVAL 24 HOUR";
    await db.query(deleteOldNonSpam);
    //console.log(`Deleted old non-spam cached messages.`);
  } catch (error) {
    console.error("Failed to delete old cached messages:", error);
  }
}

module.exports = {
  cacheUserMessage,
  retrieveCachedMessages,
  deleteCachedMessage,
  deleteOldCachedMessages,
};
