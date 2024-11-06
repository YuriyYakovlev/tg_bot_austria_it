// userModerationService.js
const db = require("../db/connectors/dbConnector");
const config = require("../config/config");


async function identifyAndMarkSpammers() {
  try {
      const [spamUserIds] = await db.query(`
          SELECT DISTINCT cm.userId
          FROM cached_messages cm
          JOIN ${config.USERS_TABLE_NAME} u ON cm.userId = u.userId
          WHERE cm.spam = TRUE AND u.kicked = FALSE
      `);

      const userIds = spamUserIds.map(row => row.userId);
      if (userIds.length > 0) {
          await db.query(`
              UPDATE ${config.USERS_TABLE_NAME}
              SET spam = TRUE
              WHERE userId IN (?)
          `, [userIds]);
      }

      const [spammers] = await db.query(`
          SELECT userId, chatId
          FROM ${config.USERS_TABLE_NAME}
          WHERE spam = TRUE AND kicked = FALSE
      `);

      return spammers;
  } catch (error) {
      console.error("Error identifying and marking spammers:", error);
      return [];
  }
}

async function markUserAsKicked(userId) {
  await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET kicked = TRUE WHERE userId = ?`, [userId] );
}

module.exports = {
  identifyAndMarkSpammers,
  markUserAsKicked,
};
