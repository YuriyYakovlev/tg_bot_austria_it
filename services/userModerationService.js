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
  await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET kicked = TRUE WHERE userId = ?`, [userId]);
}

async function kickUserIfNotAdmin(bot, chatId, userId) {
  try {
    if(chatId !== userId) {
      const member = await bot.getChatMember(chatId, userId);
      const isAdmin = member.status === 'administrator' || member.status === 'creator';
      if(isAdmin) {
        console.log(`superpower detected`);
        return false;
      } else {
        await bot.banChatMember(chatId, userId);
        await markUserAsKicked(userId);
        console.log(`Kicked user with userId: ${userId} from chat ${chatId}.`);
        return true;
      }
    }
  } catch (error) {
    console.error(`Failed to check or kick user with userId: ${userId} in chat ${chatId}`, error.message);
    return false;
  }
}

// FORCE_KICK_SPAMMERS="user1:chat1,user2:chat2"
async function kickSpammers(bot) {
  try {
    const spammers = await identifyAndMarkSpammers();

    //console.log("preparing to kick users");
    if (process.env.FORCE_KICK_SPAMMERS) {
      const extraSpammers = process.env.FORCE_KICK_SPAMMERS.split(",").map(entry => {
        const [userId, chatId] = entry.split(":");
        return { userId, chatId };
      });
      console.log("extra spammers to kick: ", extraSpammers);
    
      // Combine and remove duplicates
      for (const extra of extraSpammers) {
        if (!spammers.some(s => s.userId === extra.userId && s.chatId === extra.chatId)) {
          spammers.push(extra);
        }
      }
    }

    for (const spammer of spammers) {
      try {
        // Attempt to kick the user
        await kickUserIfNotAdmin(bot, spammer.chatId, spammer.userId);
      } catch (error) {
        console.error(`Failed to kick user: ${spammer.userId}`, error.message);
      }
    }
  } catch (error) {
    console.error("Failed to kick users:", error.message);
  }
}

module.exports = {
  identifyAndMarkSpammers,
  markUserAsKicked,
  kickUserIfNotAdmin,
  kickSpammers
};
