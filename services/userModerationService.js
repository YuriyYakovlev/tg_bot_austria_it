// userModerationService.js
const db = require("../db/connectors/dbConnector");
const config = require("../config/config");
const chatSettingsService = require('./chatSettingsService');
const languageService = require('./languageService');

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
    const member = await bot.getChatMember(chatId, userId);
    const isAdmin = member.status === 'administrator' || member.status === 'creator';

    if (!isAdmin) {
      await bot.banChatMember(chatId, userId);
      await markUserAsKicked(userId);
      console.log(`Kicked user with userId: ${userId} from chat ${chatId}.`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to check or kick user with userId: ${userId} in chat ${chatId}`, error.message);
    return false;
  }
}

async function kickSpammers(bot) {
  const spammersPerChat = new Map();

  try {
    const spammers = await identifyAndMarkSpammers();
    for (const spammer of spammers) {
      try {
        // Attempt to kick the user
        const wasKicked = await kickUserIfNotAdmin(bot, spammer.chatId, spammer.userId);

        if (wasKicked) {
          if (spammersPerChat.has(spammer.chatId)) {
            spammersPerChat.set(spammer.chatId, spammersPerChat.get(spammer.chatId) + 1);
          } else {
            spammersPerChat.set(spammer.chatId, 1);
          }
        }
      } catch (error) {
        console.error(`Failed to kick spammer with userId: ${spammer.userId}`, error.message);
      }
    }

    for (const [chatId, count] of spammersPerChat.entries()) {
      try {
        const language = await chatSettingsService.getLanguageForChat(chatId);
        const messages = languageService.getMessages(language).messages;
        const notificationMessage = messages.banSpammersComplete(count);
        
        sendTemporaryMessage(bot, chatId, notificationMessage, config.KICKED_MESSAGE_DURATION_SEC * 1000, {
          disable_notification: true
        });
        console.log(`Sent notification to chat: ${chatId}. Kicked users: ${count} `);
      } catch (error) {
        console.error(`Failed to send kicked users notification to chatId: ${chatId}`, error.message);
      }
    }
  } catch (error) {
    console.error("Failed to kick users:", error.message);
  }
}

async function sendTemporaryMessage(bot, chatId, message, timeoutMs, options = null) {
  if(!chatId){
    console.log(`sendTemporatyMessage: chatId is null. message: ${message}`);
    return;
  }
  try {
      const sentMessage = await bot.sendMessage(chatId, message, options);
      const messageId = sentMessage.message_id;

      setTimeout(async () => {
        await bot.deleteMessage(chatId, messageId).catch(() => { });
      }, timeoutMs);
  } catch (error) {
      console.error('Failed to send or schedule deletion for message', error);
  }
}

module.exports = {
  identifyAndMarkSpammers,
  markUserAsKicked,
  kickUserIfNotAdmin,
  kickSpammers
};
