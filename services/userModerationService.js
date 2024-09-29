// userModerationService.js
const db = require("../db/connectors/dbConnector");
const config = require("../config/config");


async function identifyAndMarkSpammers() {
    const [spam_messages] = await db.query(`SELECT userId, chatId FROM cached_messages WHERE is_spam = TRUE`);
    //console.log(`Found ${spam_messages ? spam_messages.length : "0"} spam message(s)`);
    for (const message of spam_messages) {
      if (message.userId && message.chatId) {
        try {
          await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET is_spammer = TRUE WHERE userId = ? AND kicked = FALSE`,
            [message.userId]);
        } catch (error) {
          console.error(`Failed to mark as spammer userId: ${user.userId}`);
        }
      }
    }

    const [spammers] = await db.query(`SELECT userId, chatId FROM ${config.USERS_TABLE_NAME} WHERE is_spammer = TRUE AND kicked = FALSE`);
    // if (spammers && spammers.length > 0) {
    //   console.log(`Found and will be kicked ${spammers.length} spammer(s)`);
    // }
    return spammers;
}

async function markUserAsKicked(userId) {
  await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET kicked = TRUE WHERE userId = ?`, [userId] );
  //console.log(`Updated spammer records for userId: ${userId} to kicked: TRUE`);
}

module.exports = {
  identifyAndMarkSpammers,
  markUserAsKicked,
};
