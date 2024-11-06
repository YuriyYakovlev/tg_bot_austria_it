// botService.js
const TelegramBot = require("node-telegram-bot-api");
const userVerificationService = require("./userVerificationService");
const spamDetectionService = require("./spamDetectionService");
const userModerationService = require("./userModerationService");
const messagesCacheService = require("./messagesCacheService");
const chatSettingsService = require('./chatSettingsService');
const languageService = require('./languageService');
const config = require("../config/config");
// const newsService = require("../extras/newsService");
// const eventsService = require("../extras/eventsService");

let bot;
const lastUserPromptTime = {};

function startBotPolling(retryCount = 0) {
  const MAX_RETRIES = 5;

  bot = new TelegramBot(process.env.TG_TOKEN, {
    polling: {
      interval: 2000,
      autoStart: true,
      params: {
        timeout: 30,
      },
    },
  });

  bot.on("message", async (msg) => {
    try {
      if (msg.new_chat_members) handleNewMembers(msg);
      if (msg.left_chat_member) handleLeftMember(msg);
  
      if (msg.reply_to_message && msg.text && msg.text.includes(`${process.env.BOT_URL}`)) {
        await handleMentionedMessage(msg);
      } else {
        await handleMessage(msg);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    const data = JSON.parse(callbackQuery.data);
    const { t, id, a, l } = data;
      
    await bot.answerCallbackQuery(callbackQuery.id);
    if (t === 'c') {
      const messages = languageService.getMessages(l).messages;
      
      const canAttempt = userVerificationService.recordUserAttempt(userId);  
      if (!canAttempt) {
          await bot.sendMessage(chatId, messages.maxAttemptReached).catch(console.error)
          console.log(`sent max attepmt reached to ${userId}`);
          return;
      }
        
      let correctAnswer = await userVerificationService.getCaptchaAnswer(id, l)
      if (a.toString() === correctAnswer.toString()) {
        await userVerificationService.setUserVerified(userId);
        await bot.sendMessage(chatId, messages.verificationComplete);
        console.log(`${userId} solved CAPTCHA`);
        
        const cachedMessages = await messagesCacheService.retrieveCachedMessages(userId);
        if (cachedMessages.length > 0) {
          const buttons = cachedMessages.map((message) => ({
            text: `${message.msg_text.substring(0, 50)}`,
            copy_text: { text: `${message.msg_text.substring(0, 256)}` },
          }));
          const options = {
            reply_markup: {
                inline_keyboard: [buttons]
            }
          };
          
          await bot.sendMessage(chatId, messages.copyPasteFromCache, options);
        }
      } else {
        await bot.sendMessage(chatId, messages.incorrectResponse);
        console.log(`${userId} answered CAPTCHA incorrectly: ${a}`);
        let newCaptcha = await userVerificationService.getRandomCaptcha(userId, l);
        const options = {
          reply_markup: {
              inline_keyboard: newCaptcha.inline_keyboard(l)
          }
        };
        await bot.sendMessage(chatId, newCaptcha.q, options).catch(console.error);
        console.log(`new CAPTCHA for ${userId}: ${newCaptcha.q.substring(0, 50)}`);
      }
    } 
  });

  bot.on("polling_error", (error) => {
    //console.error("Polling error");
    if (error.code === 'EFATAL' || error.message.includes('ECONNRESET')) {
      handleRetry(retryCount, MAX_RETRIES);
    } else if (error.code === 'ETELEGRAM' && error.message.includes('502 Bad Gateway')) {
      console.error("Telegram server error, will retry polling...");
      handleRetry(retryCount, MAX_RETRIES);
    }
  });
}

function handleRetry(retryCount, maxRetries) {
  if (retryCount < maxRetries) {
    const delay = 5000 * Math.pow(2, retryCount);
    console.log(`Attempting to restart polling after ${delay} ms...`);
    bot.stopPolling() // Ensure polling is stopped before retrying
      .then(() => {
        console.log("Polling stopped successfully.");
        setTimeout(() => startBotPolling(retryCount + 1), delay);
        console.log("Restarting polling.");
      })
      .catch(error => {
        console.error("Error stopping polling:", error);
        setTimeout(() => startBotPolling(retryCount + 1), delay); // Attempt restart even if stopPolling fails
      });
  } else {
    console.error("Max retries reached, stopping the bot");
    process.exit(1);
  }
}

// to avoid conflicts between old still running cloud run instances
setTimeout(() => {
  startBotPolling();
  cleanup();
}, 10000);

async function handleMentionedMessage(msg) {
  const { message_id, message_thread_id, chat, reply_to_message } = msg;
  const chatId = chat.id;
  const mentionedMessageId = reply_to_message.message_id;
  const mentionedMessageText = reply_to_message.text;
  const mentionedUserId = reply_to_message.from.id;
  
  if (mentionedMessageText) {
    console.log(`mentioned message to check: ${mentionedMessageText}`);
    const isSpam = await spamDetectionService.isOffensiveOrSpamMessage(mentionedMessageText);
    
    const language = await chatSettingsService.getLanguageForChat(chatId);
    const messages = languageService.getMessages(language).messages;
      
    if (isSpam) {
      await bot.deleteMessage(chatId, mentionedMessageId.toString()).catch((error) => {
        console.error(`Failed to delete message ${mentionedMessageId} from chat ${chatId}:`, error);
      });
      await bot.sendMessage(chatId, messages.spamRemoved,
        {
          message_thread_id: message_thread_id
        }
      ).catch(console.error)

      userVerificationService.resetUserVerification(mentionedUserId);
      console.log(`Deleted problematic message from chat ${chatId}. User ${mentionedUserId} verification was reset.`);
    } else {
      console.log(`Mentioned message ${mentionedMessageId} in chat ${chatId} is not problematic.`);
      await sendTemporaryMessage(bot, chatId, messages.spamNotDetected, 5000,
        {
          message_thread_id: message_thread_id,
          disable_notification: true
        }
      );
      await bot.deleteMessage(chatId, message_id.toString()).catch((error) => {
        console.error(`Failed to delete message ${message_id} from chat ${chatId}:`, error);
      });
    }
  }
}

async function handleMessage(msg) {
  const { chat, from, text, message_id, message_thread_id } = msg;
  const chatId = chat.id;
  const chatTitle = chat.title;
  const userId = from.id;
  const username = from.username;
  const firstName = from.first_name;
  const lastName = from.last_name;
 
  const userStatus = await userVerificationService.verifyUser(chatId, userId, username, firstName, lastName);
  if (userStatus && !userStatus.verified && text) {
    console.log(`message from ${userId} / ${username} / ${firstName} / ${lastName} to chat ${chatId} / ${chatTitle} / (${chat.type}): 
      ${text.replace(/\n/g, ' ').substring(0, 100)}`);
  }

  if (chat.type === "group" || chat.type === "supergroup") {
    await handleGroupMessage(userId, userStatus, chatId, message_id, message_thread_id, username, text);
  } else if (chat.type === "private") {
    await handlePrivateMessage(userStatus, chatId, text, userId, username);
  }
}

async function isUserAdmin(chatId, userId) {
  const member = await bot.getChatMember(chatId, userId);
  return member.status === 'administrator' || member.status === 'creator';
}

async function handleGroupMessage(userId, userStatus, chatId, messageId, message_thread_id, username, text) {
  let messageDeleted = false;
  if (userStatus && !userStatus.verified) {
    
    const isAdmin = await isUserAdmin(chatId, userId);
    if (isAdmin) {
        userVerificationService.setUserVerified(userId);
        console.log('superpower detected');
        return;
    }

    // Delete the message from the group
    await bot.deleteMessage(chatId, messageId.toString()).catch((error) => {
      console.error(`Failed to delete message ${messageId} from chat ${chatId}:`, error);
    });
    messageDeleted = true;
    
    if(text) {
      // CHECK FOR SPAM
      if(userStatus.spam === 1 || userStatus.spam === true) {
        console.log(`user ${userId} was marked as spam, no additional verification needed`);
        return;
      }
      const problematicMessage = await spamDetectionService.isOffensiveOrSpamMessage(text);
      if (problematicMessage) {
        console.log(`yes, it was spam from ${userId} to chat ${chatId}`);
        userVerificationService.resetUserVerification(userId, true);
        // to consider to kick user right here
        return;
      } else {
        console.log(`no problems in message from ${userId} discovered`);
      }

      // SEND VERIFICATION MESSAGE TO NORMAL USERS
      messagesCacheService.cacheUserMessage(userId, chatId, messageId, text);
    
      // Generate a unique key for the chat-user combination
      const userKey = `${chatId}-${userId}`;

      // Check if a verification message has recently been sent to this user
      const lastPromptTime = lastUserPromptTime[userKey] || 0;
      const currentTime = Date.now();
      if (currentTime - lastPromptTime > 5000) {
          const language = await chatSettingsService.getLanguageForChat(chatId);
          const messages = languageService.getMessages(language).messages;
          const buttons = languageService.getMessages(language).buttons;

          sendTemporaryMessage(bot, chatId, messages.verifyPromptGroup(username), 40000, 
            {
              reply_markup: {
                  inline_keyboard: [[{ text: buttons.start, url: `tg://resolve?domain=${process.env.BOT_URL}&start`}]]
              },
              message_thread_id: message_thread_id,
              disable_notification: true
            }
          );
          lastUserPromptTime[userKey] = currentTime;
          console.log(`sent temporary verify message to ${userId}`);
      }
      return;
    }
  }

  // Check if user joined within the last 15 minutes and call AI service for spam validation even for verified users
  if(text) {
    const joinTime = new Date(userStatus.created_at);
    const joinTimeUTC = joinTime.getTime() + (60 * 60 * 1000);
    if ((Date.now() - joinTimeUTC) < 15 * 60 * 1000) {
      console.log(`check newly added user ${userId} for spam`);
      const isSpam = await spamDetectionService.isOffensiveOrSpamMessage(text);
      if (isSpam) {
        console.log(`yes, it was spam from verified user ${userId} to chat ${chatId}`);
        if (!messageDeleted) {
          await bot.deleteMessage(chatId, messageId.toString()).catch((error) => {
            console.error(`Failed to delete message ${messageId} from chat ${chatId}:`, error);
          });
        }
        userVerificationService.resetUserVerification(userId, true);
      } else {
        console.log('no spam in new user message');
      }
    }
  }
}

async function handlePrivateMessage(userStatus, chatId, text, userId, username) {
  const cachedMessages = await messagesCacheService.retrieveCachedMessages(userId);
  const language = await chatSettingsService.getLanguageForChat(cachedMessages.length > 0 ? cachedMessages[0].chatId : chatId);
  const messages = languageService.getMessages(language).messages;

  if (userStatus && !userStatus.verified) {
    const canAttempt = userVerificationService.recordUserAttempt(userId);  
    if (!canAttempt) {
        await bot.sendMessage(userId, messages.maxAttemptReached).catch(console.error)
        console.log(`sent max attepmt reached to ${userId}`);
        return;
    }

    if (text === "/verify" || text === "/start") {
      let captcha = await userVerificationService.getRandomCaptcha(userId, language, chatId);
      console.log(`CAPTCHA for ${userId} / ${username}: ${captcha.q}`);
      await bot.sendMessage(chatId, messages.welcome)

      const options = {
        reply_markup: {
            inline_keyboard: captcha.inline_keyboard(language)
        }
      };
      await bot.sendMessage(chatId, captcha.q, options).catch(console.error);
      return;
    }
  } else {
    if (text) {
      console.log(`user ${userId} / ${username} sent this message to private chat: ${text} `);
    }
    await bot.sendMessage(userId, messages.thanksMessage).catch(console.error);
    //console.log(`sent thanks message to ${userId} / ${username} `);
  }
}

function handleNewMembers(msg) {
  const { chat } = msg;

  msg.new_chat_members.forEach((member) => {
    try {
      console.log(`new chat member: ${member.id} / ${member.username} / ${member.first_name} / ${member.last_name} in chat: ${chat.id} / ${chat.title}`);
    } catch (error) {
      console.error(`Failed to get user info`);
    }
  });
}

function handleLeftMember(msg) {
    const leftUser = msg.left_chat_member;
    try {
      console.log("Member left or was removed:", JSON.stringify(leftUser, null, 2));
      //console.log(`Member left or was removed: ${leftUser.username} (ID: ${leftUser.id})`);
      if (leftUser.id) {
        userVerificationService.resetUserVerification(leftUser.id).catch(console.error);
      }
    } catch (error) {
      console.error(`Failed to get user info`);
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

async function cleanup() {
  try {
    await spamDetectionService.classifyMessages();
    await kickSpammers();
    userVerificationService.cleanupUserAttempts();
    userVerificationService.cleanupVerifiedUsersCache();
  } catch (error) {
    console.error('Error while performing cleanup:', error.message);
  }
}

async function kickSpammers() {
  try {
      const spammers = await userModerationService.identifyAndMarkSpammers();
      let chatId;
      if(spammers.length > 0) {
        chatId = spammers[0].chatId;
      }
      for (const spammer of spammers) {
          try {
              const isAdmin = await isUserAdmin(spammer.chatId, spammer.userId);
              if (!isAdmin) {
                await bot.banChatMember(spammer.chatId, spammer.userId);
                await userModerationService.markUserAsKicked(spammer.userId);
                console.log(`Kicked user with userId: ${spammer.userId} from chat ${spammer.chatId}.`);
              }
          } catch (error) {
              console.error(`Failed to kick and update spammer with userId: ${spammer.userId}`, error.message);
          }
      }
  } catch (error) {
      console.error("Failed to kick spammers:", error);
  }
}

// async function summarizeNews() {
//   let news = await newsService.summarizeNews();
//   await new Promise(resolve => setTimeout(resolve, 11000)); 
//   await bot.sendMessage(353740703, news).catch(console.error);
//   console.log('summarised news: ' + news);
// }

// async function summarizeEvents() {
//   let events = await eventsService.summarizeEvents();
//   await new Promise(resolve => setTimeout(resolve, 1000)); //11000)); 
//   //await bot.sendMessage(353740703, events).catch(console.error);
//   console.log('summarised events: ' + events);
// }

//summarizeNews();
// summarizeEvents();
setInterval(() => {
  cleanup();
}, 3600000 * config.CLEANUP_INTERVAL_HOURS);


process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at:", p, "reason:", reason);
});

process.on("SIGINT", () => {
  if (bot) {
    bot.stopPolling().then(() => process.exit());
  }
});

process.on("SIGTERM", () => {
  if (bot) {
    bot.stopPolling().then(() => process.exit());
  }
});

