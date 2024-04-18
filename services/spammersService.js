// processSpammersService.js
const db = require("../db/connectors/dbConnector");
const config = require("../config/config");

async function kickSpammers() {
  try {
    console.log(`Kick spammers Job started`);

    const [spam_messages] = await db.query(`SELECT userId, chatId FROM cached_messages WHERE is_spam = TRUE`);
    for (const message of spam_messages) {
      if (message.userId && message.chatId) {
        try {
          await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET is_spammer = TRUE WHERE userId = ? AND kicked = FALSE`,
            [message.userId]);
        } catch (error) {
          console.error(`Failed to kick and update spammer with userId: ${user.userId}`);
        }
      }
    }

    const [rows] = await db.query(`SELECT userId, chatId FROM ${config.USERS_TABLE_NAME} WHERE is_spammer = TRUE AND kicked = FALSE`);
    for (const user of rows) {
      if (user.chatId && user.userId) {
        try {
          await bot.banChatMember(user.chatId, user.userId);
          console.log(`Kicked spammer with userId: ${user.userId} from chat ${user.chatId}.`);

          await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET kicked = TRUE WHERE userId = ?`, [user.userId]);
        } catch (error) {
          console.error(`Failed to kick and update spammer with userId: ${user.userId}`);
        }
      }
    }

    console.log(`Kick spammers Job finished`);
  } catch (error) {
    console.error("Failed to retrieve spammers from database:", error);
  }
}

module.exports = {
  kickSpammers,
};
