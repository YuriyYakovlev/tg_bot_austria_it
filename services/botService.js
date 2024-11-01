// botService.js
const TelegramBot = require("node-telegram-bot-api");
const userVerificationService = require("./userVerificationService");
const spamDetectionService = require("./spamDetectionService");
const userModerationService = require("./userModerationService");
const messagesCacheService = require("./messagesCacheService");
// const newsService = require("../extras/newsService");
// const eventsService = require("../extras/eventsService");
const config = require("../config/config");

let bot;
const userJoinTimes = {};

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
  
      await handleMessage(msg);
    } catch (error) {
      console.error("Error handling message:", error);
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
    // else {
    //   console.error("Unexpected error type, may require manual intervention.");
    // }
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


async function handleMessage(msg) {
  const { chat, from, text } = msg;
  const chatId = chat.id;
  const chatTitle = chat.title;
  const userId = from.id;
  const username = from.username;
  const firstName = from.first_name;
  const lastName = from.last_name;
 
  // console.log(`processing message in chat: ${chatId}`);
  const userStatus = await userVerificationService.verifyUser(chatId, userId, username, firstName, lastName);
  if (userStatus && !userStatus.verified && text) {
    console.log(`Suspicious message from ${userId} / ${username} / ${firstName} / ${lastName} to chat ${chatId} / ${chatTitle} / (${chat.type}): 
      ${text.replace(/\n/g, ' ').substring(0, 30)} ...`);
  }

  if (chat.type === "group" || chat.type === "supergroup") {
    await handleGroupMessage(userId, userStatus, chatId, msg.message_id, username, text);
  } else if (chat.type === "private") {
    await handlePrivateMessage(userStatus, chatId, text, userId, username);
  }
}

async function isUserAdmin(chatId, userId) {
  const member = await bot.getChatMember(chatId, userId);
  return member.status === 'administrator' || member.status === 'creator';
}

// Use an object to track the last prompt times for each user in each chat
const lastUserPromptTime = {};

async function handleGroupMessage(userId, userStatus, chatId, messageId, username, text) {
  if (userStatus && !userStatus.verified) {

    const isAdmin = await isUserAdmin(chatId, userId);
    if (isAdmin) {
        userVerificationService.setUserVerified(userId);
        return;
    }

    // Delete the message from the group
    await bot.deleteMessage(chatId, messageId.toString()).catch(() => { });

    // Cache the message
    if(text) {
      // console.log(`message from ${username} was deleted`);
      messagesCacheService.cacheUserMessage(userId, chatId, messageId, text);
    
      // Generate a unique key for the chat-user combination
      const userKey = `${chatId}-${userId}`;

      // Check if a verification message has recently been sent to this user
      const lastPromptTime = lastUserPromptTime[userKey] || 0;
      const currentTime = Date.now();
      if (currentTime - lastPromptTime > 600000) {
          sendTemporaryMessage(bot, chatId, config.messages.verifyPromptGroup(username), 40000);
          lastUserPromptTime[userKey] = currentTime;
          //console.log(`sent temporary verify message to ${userId} / ${username} to chat ${chatId}`);
      }
    }
  }

  // Check if user joined within the last 15 minutes and call AI service for spam validation
  if(text) {
    const joinTime = userJoinTimes[userId];
    if (joinTime && ((Date.now() - joinTime) < 15 * 60 * 1000)) {
      console.log(`check new user ${userId} for spam`);
      const isSpam = await spamDetectionService.isSpamMessage(text);
      if (isSpam) {
        console.log(`${userId} / ${username} sent a potential spam message to chat ${chatId}: 
          ${ text.length > 100 ? text.substring(0, 100) + "..."  : text }`);

        await bot.deleteMessage(chatId, messageId.toString()).catch(() => { });
        console.log(`Deleted potential spam message from ${username}.`);
        userVerificationService.resetUserVerification(userId);
      } else {
        console.log('no spam in new user message');
      }
    }
  }
}

async function handlePrivateMessage(userStatus, chatId, text, userId, username) {
  if (userStatus && !userStatus.verified) {
    if (!userStatus.allowed) {
        await bot.sendMessage(chatId, config.messages.maxAttemptReached).catch(console.error);
        console.log(`sent max attepmt reached for ${userId} / ${username}`);
        return;
    }

    if (text === "/verify" || text === "/start") {
      console.log(`CAPTCHA for ${userId} / ${username}: ${userStatus.captcha.substring(0, 30)}`);
      await bot.sendMessage(chatId, config.messages.welcome + userStatus.captcha).catch(console.error);
      return;
    }
    
    // Handle CAPTCHA response
    if (text === userStatus.answer) {
      console.log(`${userId} / ${username} answers CAPTCHA correctly in chat ${chatId}`);
      try {
        await userVerificationService.setUserVerified(userId);
        await bot.sendMessage(chatId, config.messages.verificationComplete);

        const messages = await messagesCacheService.retrieveCachedMessages(userId);
        if (messages.length > 0) {
          await bot.sendMessage(userId, config.messages.copyPasteFromCache);
        }

        messages.forEach(async (message) => {
          try {
            await bot.sendMessage(userId, message.messageText);
            //console.log(`Reminded cached message for user ${userId}`);
            await messagesCacheService.deleteCachedMessage(message.messageId);
          } catch (error) {
            console.error(`Error sending cached message to user ${userId}:`, error);
          }
        });

      } catch (error) {
        console.error("Failed to set user as verified:", error);
        await bot.sendMessage(chatId, config.messages.verificationError).catch(console.error);
      }
    } else {
      try {
        let newCaptcha = userVerificationService.getRandomCaptcha(userId); // show a new CAPTCHA in case of wrong answer
        await userVerificationService.updateUserCaptcha(userId, newCaptcha);

        bot.sendMessage(chatId, config.messages.incorrectResponse + newCaptcha.question);
        console.log(`CAPTCHA for ${userId} / ${username} again: ${newCaptcha.question.substring(0, 30)}`);
      } catch (error) {
        console.error("Failed to update CAPTCHA info:", error);
        bot.sendMessage(chatId, config.messages.verificationError);
      }
    }
  } else {
    if (text) {
      console.log(`user ${userId} / ${username} sent this message to private chat: ${text} `);
    }
    await bot.sendMessage(userId, config.messages.thanksMessage).catch(console.error);
    //console.log(`sent thanks message to ${userId} / ${username} `);
  }
}

function handleNewMembers(msg) {
  const { chat } = msg;

  msg.new_chat_members.forEach((member) => {
    try {
      console.log(`new chat member: ${member.id} / ${member.username} / ${member.first_name} / ${member.last_name} in chat: ${chat.id} / ${chat.title}`);
      userJoinTimes[member.id] = Date.now();
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

async function sendTemporaryMessage(bot, chatId, message, timeoutMs) {
    try {
        const sentMessage = await bot.sendMessage(chatId, message);
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
    await messagesCacheService.deleteOldCachedMessages();
    cleanupUserJoinTimes();
  } catch (error) {
    console.error('Error while performing cleanup:', error.message);
  }
}

async function kickSpammers() {
  try {
      //console.log(`Kick spammers Job started`);
      const spammers = await userModerationService.identifyAndMarkSpammers();
      let deletedCount = 0;
      let chatId;
      if(spammers.length > 0) {
        chatId = spammers[0].chatId;
      }
      for (const spammer of spammers) {
          try {
              await bot.banChatMember(spammer.chatId, spammer.userId);
              await userModerationService.markUserAsKicked(spammer.userId);
              deletedCount++;
              console.log(`Kicked spammer with userId: ${spammer.userId} from chat ${spammer.chatId}.`);
          } catch (error) {
              //console.error(`Failed to kick and update spammer with userId: ${spammer.userId}`, error.message);
          }
      }
      if(deletedCount > 0 && chatId) {
        sendTemporaryMessage(bot, chatId, config.messages.banSpammersComplete(deletedCount), 20000);
        //console.log(`sent temporary status message to chat ${chatId}`);
      }
      //console.log(`Kick spammers Job finished`);
  } catch (error) {
      console.error("Failed to kick spammers:", error);
  }
}

function cleanupUserJoinTimes() {
  const now = Date.now();
  const THRESHOLD = 1 * 60 * 60 * 1000; // 1 hour
  for (const userId in userJoinTimes) {
    if (now - userJoinTimes[userId] > THRESHOLD) {
      delete userJoinTimes[userId];
      //console.log(`Removed old join time entry for user ${userId}`);
    }
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
}, 3600000 * 1);  // 3600000 milliseconds = 1 hour


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

