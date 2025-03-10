// privateMessageService.js
const userVerificationService = require("./userVerificationService");
const messagesCacheService = require("./messagesCacheService");
const chatSettingsService = require('./chatSettingsService');
const languageService = require('./languageService');
const config = require("../config/config");


async function handlePrivateMessage(bot, msg) {
  const { chat, from, text } = msg;
  const chatId = chat.id;
  const userId = from.id;
  const username = from.username;

  const userStatus = await userVerificationService.verifyUser(chatId, userId, username, from.first_name, from.last_name);

  const cachedMessages = await messagesCacheService.retrieveCachedMessages(userId);
  const language = await chatSettingsService.getLanguageForChat(cachedMessages.length > 0 ? cachedMessages[0].chatId : chatId);
  const messages = languageService.getMessages(language).messages;

  console.log(`user ${userId} / ${username} sent this message to private chat: ${text} `);
  
  if (userStatus && !userStatus.verified) {
    const canAttempt = userVerificationService.recordUserAttempt(userId);
    if (!canAttempt) {
      await bot.sendMessage(userId, messages.maxAttemptReached(config.ATTEMPTS_TIMEOUT_MIN)).catch(console.error);
      console.log(`sent max attepmt reached to ${userId}`);
      return;
    }

    if (text === "/verify" || text === "/start") {
      const captcha = await userVerificationService.getRandomCaptcha(userId, language, chatId);
      console.log(`CAPTCHA for ${userId} / ${username}: ${captcha.q}`);
      const options = {
        parse_mode: 'html',
        reply_markup: { inline_keyboard: captcha.inline_keyboard(language) }
      };
      await bot.sendMessage(chatId, messages.welcome + '\n\n' + `<b>${captcha.q}</b>`, options).catch(console.error);
      return;
    } 
  } else {
    await bot.sendMessage(userId, messages.thanksMessage).catch(console.error);
  }
}

module.exports = { handlePrivateMessage };
