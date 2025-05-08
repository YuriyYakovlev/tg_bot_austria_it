// mentionService.js
const spamDetectionService = require("./spamDetectionService");
const userVerificationService = require("./userVerificationService");
const chatSettingsService = require("./chatSettingsService");
const languageService = require("./languageService");
const config = require("../config/config");

async function handleMentionedMessage(bot, msg) {
  const { message_id, message_thread_id, chat, reply_to_message } = msg;
  const chatId = chat.id;
  const mentionedMessageId = reply_to_message.message_id;
  const mentionedMessageText = reply_to_message.text;
  const mentionedUserId = reply_to_message.from.id;
  
  if (mentionedMessageText) {
    console.log(`mentioned message to check: ${mentionedMessageText}`);
    const messageAnalysis = await spamDetectionService.isOffensiveOrSpamMessage(mentionedMessageText);
    
    const language = await chatSettingsService.getLanguageForChat(chatId);
    const messages = languageService.getMessages(language).messages;
      
    if (messageAnalysis.isOffensive) {
      const deleted = await bot.deleteMessage(chatId, mentionedMessageId.toString())
      .then(() => true)
      .catch((error) => {
        console.error(`Failed to delete message ${mentionedMessageId} from chat ${chatId}:`, error);
        return false;
      });
      if (!deleted) return;
  
      await bot.sendMessage(chatId, messages.spamRemoved, {
        message_thread_id: message_thread_id
      }).catch(console.error);

      userVerificationService.resetUserVerification(mentionedUserId);
      console.log(`Deleted mentioned message from chat ${chatId}. Reason: ${messageAnalysis.reason}` +`. User ${mentionedUserId} was muted.`);
    } else {
      console.log(`Mentioned message ${mentionedMessageId} in chat ${chatId} is not problematic.`);
      await sendTemporaryMessage(bot, chatId, messages.spamNotDetected, config.MENTIONED_MESSAGE_DURATION_SEC * 1000, {
        message_thread_id: message_thread_id,
        disable_notification: true
      });
      setTimeout(async () => {
        await bot.deleteMessage(chatId, message_id.toString()).catch((error) => {
          console.error(`Failed to delete message ${message_id} from chat ${chatId}:`, error.message);
        });
      }, config.MENTIONED_MESSAGE_DURATION_SEC * 1000);
    }
  }
}

async function sendTemporaryMessage(bot, chatId, message, timeoutMs, options = null) {
  if (!chatId) {
    console.log(`sendTemporaryMessage: chatId is null. message: ${message}`);
    return;
  }
  try {
    const sentMessage = await bot.sendMessage(chatId, message, options);
    const messageId = sentMessage.message_id;

    setTimeout(async () => {
      await bot.deleteMessage(chatId, messageId).catch(() => { });
    }, timeoutMs);
  } catch (error) {
    console.error("Failed to send or schedule deletion for message", error);
  }
}

module.exports = {
  handleMentionedMessage,
};
