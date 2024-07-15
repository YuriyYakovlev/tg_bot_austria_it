// botService.js
const TelegramBot = require("node-telegram-bot-api");
const verificationService = require("./verificationService");
const aiService = require("./aiService");
const spammersService = require("./spammersService");
const messagesCache = require("./messagesCache");
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
    console.error("Polling error");
    if (error.code === 'EFATAL' || error.message.includes('ECONNRESET')) {
      handleRetry(retryCount, MAX_RETRIES);
    } else if (error.code === 'ETELEGRAM' && error.message.includes('502 Bad Gateway')) {
      console.error("Telegram server error, will retry polling...");
      handleRetry(retryCount, MAX_RETRIES);
    } else {
      console.error("Unexpected error type, may require manual intervention.");
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
}, 10000);


async function handleMessage(msg) {
  const { chat, from, text } = msg;
  const chatId = chat.id;
  const userId = from.id;
  const username = from.username;
  const firstName = from.first_name;
  const lastName = from.last_name;
 
  //console.log(`processing message in chat: ${chatId} / ${chat.type}`);
  const userStatus = await verificationService.verifyUser(chatId, userId, username, firstName, lastName);
  if (userStatus && !userStatus.verified && text) {
    console.log(`${userId} / ${username} / ${firstName} / ${lastName} sent a message to chat ${chatId} / ${chat.type}: 
      ${ text.length > 100 ? text.substring(0, 100) + "..."  : text }`);
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
        verificationService.setUserVerified(userId);
        return;
    }

    // Delete the message from the group
    await bot.deleteMessage(chatId, messageId.toString()).catch(console.error);

    // Cache the message
    if(text) {
      console.log(`message from ${username} was deleted`);
      messagesCache.cacheUserMessage(userId, chatId, messageId, text);
    
      // Generate a unique key for the chat-user combination
      const userKey = `${chatId}-${userId}`;

      // Check if a verification message has recently been sent to this user
      const lastPromptTime = lastUserPromptTime[userKey] || 0;
      const currentTime = Date.now();
      if (currentTime - lastPromptTime > 600000) {
          sendTemporaryMessage(bot, chatId, config.messages.verifyPromptGroup(username), 40000);
          lastUserPromptTime[userKey] = currentTime;
          console.log(`sent temporary verify message to ${userId} / ${username} to chat ${chatId}`);
      }
    }

    return;
  } else {
    // Check if user joined within the last 10 minutes and call AI service for spam validation
    const joinTime = userJoinTimes[userId];
    if (joinTime && (Date.now() - joinTime < 10 * 60 * 1000)) {
      const isSpam = await aiService.isSpamMessage(text);
      if (isSpam) {
        console.log(`${userId} / ${username} sent a potential span message to chat ${chatId}: 
          ${ text.length > 100 ? text.substring(0, 100) + "..."  : text }`);

        await bot.deleteMessage(chatId, messageId.toString()).catch(console.error);
        console.log(`Deleted potential spam message from ${username}.`);
        verificationService.resetUserVerification(userId);
        return;
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
      console.log(`Prompting CAPTCHA for ${userId} / ${username}: ${userStatus.captcha}`);
      await bot.sendMessage(chatId, config.messages.welcome + userStatus.captcha).catch(console.error);
      return;
    }
    
    // Handle CAPTCHA response
    if (text === userStatus.answer) {
      console.log(`${userId} / ${username} answers CAPTCHA correctly in chat ${chatId}`);
      try {
        await verificationService.setUserVerified(userId);
        await bot.sendMessage(chatId, config.messages.verificationComplete);

        const messages = await messagesCache.retrieveCachedMessages(userId);
        if (messages.length > 0) {
          await bot.sendMessage(userId, config.messages.copyPasteFromCache);
        }

        messages.forEach(async (message) => {
          try {
            await bot.sendMessage(userId, message.messageText);
            console.log(`Reminded cached message for user ${userId}`);
            await messagesCache.deleteCachedMessage(message.messageId);
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
        let newCaptcha = verificationService.getRandomCaptcha(userId); // show a new CAPTCHA in case of wrong answer
        await verificationService.updateUserCaptcha(userId, newCaptcha);

        bot.sendMessage(chatId, config.messages.incorrectResponse + newCaptcha.question);
        console.log(`Prompting CAPTCHA for ${userId} / ${username} again: ${newCaptcha.question}`);
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
    console.log(`sent thanks message to ${userId} / ${username} `);
  }
}

function handleNewMembers(msg) {
  msg.new_chat_members.forEach((member) => {
    try {
      console.log("New member added:", JSON.stringify(member, null, 2));
      // Record the join time of the user
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
        verificationService.resetUserVerification(leftUser.id).catch(console.error);
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
            try {
                await bot.deleteMessage(chatId, messageId);
                console.log(`removed temporary message`);
            } catch (error) {
                console.error(`Failed to delete message: ${messageId}`, error);
            }
        }, timeoutMs);
    } catch (error) {
        console.error('Failed to send or schedule deletion for message', error);
    }
}

async function cleanup() {
  await aiService.classifyMessages();
  await kickSpammers();
  await messagesCache.deleteOldCachedMessages();
  cleanupUserJoinTimes();
}

async function kickSpammers() {
  try {
      console.log(`Kick spammers Job started`);
      const spammers = await spammersService.findSpammers();
      let deletedCount = 0;
      let chatId;
      if(spammers.length > 0) {
        chatId = spammers[0].chatId;
      }
      for (const spammer of spammers) {
          try {
              await bot.banChatMember(spammer.chatId, spammer.userId);
              await spammersService.updateSpammersRecords(spammer.userId);
              deletedCount++;
              console.log(`Kicked spammer with userId: ${spammer.userId} from chat ${spammer.chatId}.`);
          } catch (error) {
              console.error(`Failed to kick and update spammer with userId: ${spammer.userId}`, error.message);
          }
      }
      if(deletedCount > 0 && chatId) {
        sendTemporaryMessage(bot, chatId, config.messages.banSpammersComplete(deletedCount), 20000);
        console.log(`sent temporary status message to chat ${chatId}`);
      }
      console.log(`Kick spammers Job finished`);
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
      console.log(`Removed old join time entry for user ${userId}`);
    }
  }
}

cleanup();
setInterval(() => {
  cleanup();
}, 3600000 * 4);  // 3600000 milliseconds = 1 hour


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

