//botService.js
const TelegramBot = require("node-telegram-bot-api");
const verificationService = require("./verificationService");
const spammersService = require("./spammersService");
const messagesCache = require("./messagesCache");
const config = require("../config/config");


const bot = new TelegramBot(process.env.TG_TOKEN, {
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

async function handleMessage(msg) {
  const { chat, from, text } = msg;
  const chatId = chat.id;
  const userId = from.id;
  const username = from.username || "unknown";
 
  //console.log(`processing message in chat: ${chatId} / ${chat.type}`);
  const userStatus = await verificationService.verifyUser(chatId, userId, username);
  if (!userStatus.verified) {
    console.log(`${userId} / ${username} sent a message to chat ${chatId} / ${chat.type}: 
      ${ text ? text.length > 100 ? text.substring(0, 100) + "..."  : text : "No text provided" }`);
  }

  if (chat.type === "group" || chat.type === "supergroup") {
    await handleGroupMessage(userId, userStatus, chatId, msg.message_id, username, text);
  } else if (chat.type === "private") {
    await handlePrivateMessage(userStatus, chatId, text, userId, username);
  }
}

// Use an object to track the last prompt times for each user in each chat
const lastUserPromptTime = {};

async function handleGroupMessage(userId, userStatus, chatId, messageId, username, text) {
  if (!userStatus.verified) {
    // Delete the message from the group
    await bot.deleteMessage(chatId, messageId.toString()).catch(console.error);
    console.log(`message from ${username} was deleted`);

    // Cache the message
    if(text) {
      messagesCache.cacheUserMessage(userId, chatId, messageId, text);
    }

    // Generate a unique key for the chat-user combination
    const userKey = `${chatId}-${userId}`;

    // Check if a verification message has recently been sent to this user
    const lastPromptTime = lastUserPromptTime[userKey] || 0;
    const currentTime = Date.now();
    if (text && (currentTime - lastPromptTime > 600000)) {
        sendTemporaryMessage(bot, chatId, `@${username} ${config.messages.verifyPromptGroup}`, 40000);
        lastUserPromptTime[userKey] = currentTime;
        console.log(`sent temporary verify message to ${username} to chat ${chatId}`);
    }

    return;
  }
}

async function handlePrivateMessage(userStatus, chatId, text, userId, username) {
  if (!userStatus.verified) {
    if (!userStatus.allowed) {
        await bot.sendMessage(chatId, config.messages.maxAttemptReached).catch(console.error);
        console.log(`sent max attepmt reached for ${username}`);
        return;
    }

    if (text === "/verify" || text === "/start") {
      console.log(`Prompting CAPTCHA for ${username}: ${userStatus.captcha}`);
      await bot.sendMessage(chatId, config.messages.welcome + userStatus.captcha).catch(console.error);
      return;
    }
    // Handle CAPTCHA response
    if (text.match(/^[a-zA-Z0-9]*\.?\d*$/)) {
      if (text === userStatus.answer) {
        console.log(`${username} answers CAPTCHA correctly in chat ${chatId}`);
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
          console.log(`Prompting CAPTCHA for ${username} again: ${newCaptcha.question}`);
        } catch (error) {
          console.error("Failed to update CAPTCHA info:", error);
          bot.sendMessage(chatId, config.messages.verificationError);
        }
      }
    } else {
      await bot.sendMessage(chatId, config.messages.startVerification).catch(console.error);
      console.log(`sent start verificaiton message to ${username} `);
    }
  } else {
    await bot.sendMessage(userId, config.messages.verificationComplete).catch(console.error);
    console.log(`sent verificaiton complete message to ${username} `);
  }
}

function handleNewMembers(msg) {
  msg.new_chat_members.forEach((member) => {
    try {
      console.log("New member added:", JSON.stringify(member, null, 2));
    } catch (error) {
      console.error(`Failed to get user info`);
    }
  });
}

function handleLeftMember(msg) {
    const leftUser = msg.left_chat_member;
    console.log(`Member left or was removed: ${leftUser.username} (ID: ${leftUser.id})`);
    verificationService.resetUserVerification(leftUser.id).catch(console.error);
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


spammersService.kickSpammers();
setInterval(() => {
  spammersService.kickSpammers();
}, 3600000 * 8);  // 3600000 milliseconds = 1 hour


process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at:", p, "reason:", reason);
});

process.on("SIGINT", () => bot.stopPolling().then(() => process.exit()));
process.on("SIGTERM", () => bot.stopPolling().then(() => process.exit()));


module.exports = bot;
