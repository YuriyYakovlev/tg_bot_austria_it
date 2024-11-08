// groupMessageService.js
const userVerificationService = require("./userVerificationService");
const userModerationService = require("./userModerationService");
const spamDetectionService = require("./spamDetectionService");
const messagesCacheService = require("./messagesCacheService");
const chatSettingsService = require('./chatSettingsService');
const languageService = require('./languageService');
const config = require("../config/config");


async function handleGroupMessage(bot, msg, userSessionData) {
  const { chat, from, text, message_id, message_thread_id } = msg;
  const chatId = chat.id;
  const userId = from.id;
  const username = from.username;

  const userStatus = await userVerificationService.verifyUser(chatId, userId, username, from.first_name, from.last_name);

  let messageDeleted = false;

  if (!userStatus.verified) {
    // const isAdmin = await isUserAdmin(bot, chatId, userId);
    // if (isAdmin) {
    //   userVerificationService.setUserVerified(userId);
    //   console.log('superpower detected');
    //   return;
    // }
    
    await bot.deleteMessage(chatId, message_id.toString()).catch(console.error);
    messageDeleted = true;

    let messageContent = msg.text 
        ? msg.text.replace(/\n/g, ' ').substring(0, 100) 
        : msg.photo
        ? '[Photo]'
        : msg.video
        ? '[Video]'
        : msg.audio
        ? '[Audio]'
        : msg.document
        ? '[Document]'
        : msg.voice
        ? '[Voice Message]'
        : msg.video_note
        ? '[Video Note]'
        : msg.contact
        ? '[Contact]'
        : msg.location
        ? '[Location]'
        : msg.sticker
        ? `[Sticker: ${msg.sticker.emoji || 'Unknown'}]`
        : msg.poll
        ? '[Poll]'
        : msg.animation
        ? '[Animation]'
        : '[Unknown content type]';

    console.log(`message from ${userId} / ${username} / ${from.first_name} / ${from.last_name} to chat ${chatId} / ${chat.title}: ${messageContent}`);

    if (text) {
      // CHECK FOR SPAM
      if(userStatus.spam === 1 || userStatus.spam === true) {
        console.log(`user ${userId} was marked as spam, no additional verification needed`);
        return;
      }
      const messageAnalysis = await spamDetectionService.isOffensiveOrSpamMessage(text);

      if (messageAnalysis.isOffensive) {
        console.log(`problem detected from ${userId} to chat ${chatId}: ${messageAnalysis.reason}`);
        userVerificationService.resetUserVerification(userId, true);
        if(messageAnalysis.reason === config.KICK_REASONS.ILLEGAL_GOODS) {
            userModerationService.kickUserIfNotAdmin(bot, chatId, userId);
        }
        return;
      }
      console.log(`no problems detected from ${userId} to chat ${chatId}`);

      // SEND VERIFICATION MESSAGE TO NORMAL USERS
      messagesCacheService.cacheUserMessage(userId, chatId, message_id, text);

      const sessionData = userSessionData.get(userId) || {};
      const currentTime = Date.now();
      
      if (!sessionData.promptTime || (currentTime - sessionData.promptTime > config.VERIFY_PROMPT_DURATION_SEC * 1000)) {
        const language = await chatSettingsService.getLanguageForChat(chatId);
        const messages = languageService.getMessages(language).messages;
        const buttons = languageService.getMessages(language).buttons;

        sendTemporaryMessage(bot, chatId, messages.verifyPromptGroup(username), config.VERIFY_PROMPT_DURATION_SEC * 1000, {
          reply_markup: {
            inline_keyboard: [[{ text: buttons.start, url: `tg://resolve?domain=${process.env.BOT_URL}&start` }]]
          },
          message_thread_id: message_thread_id,
          disable_notification: true
        });
        
        userSessionData.set(userId, {
          chatId,
          promptTime: currentTime,
          chat_username: chat.username,
          thread_id: msg.message_thread_id,
        });

        console.log(`sent temporary verify message to ${userId}`);
      }
      return;
    }
  }

  if (text) {
    const joinTime = new Date(userStatus.created_at);
    const joinTimeUTC = joinTime.getTime() + (60 * 60 * 1000);
    if ((Date.now() - joinTimeUTC) < 15 * 60 * 1000) {
        console.log(`check newly added user ${userId} for spam`);
        const messageAnalysis = await spamDetectionService.isOffensiveOrSpamMessage(text);
        if (messageAnalysis.isOffensive) {
            if (!messageDeleted) {
                await bot.deleteMessage(chatId, message_id.toString()).catch(console.error);
            }
            userVerificationService.resetUserVerification(userId, true);
        } else {
        console.log('no spam in new user message');
        }
    }
  }
}

// async function isUserAdmin(bot, chatId, userId) {
//   const member = await bot.getChatMember(chatId, userId);
//   return member.status === 'administrator' || member.status === 'creator';
// }

async function sendTemporaryMessage(bot, chatId, message, timeoutMs, options = null) {
  try {
    const sentMessage = await bot.sendMessage(chatId, message, options);
    const messageId = sentMessage.message_id;
    setTimeout(async () => {
      await bot.deleteMessage(chatId, messageId).catch(() => {});
    }, timeoutMs);
  } catch (error) {
    console.error("Failed to send or delete temporary message:", error);
  }
}

module.exports = { handleGroupMessage };
