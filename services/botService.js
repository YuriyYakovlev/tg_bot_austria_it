//botService.js
const TelegramBot = require("node-telegram-bot-api");
const verificationService = require("./verificationService");
const config = require("../config/config");
const db = require("../db/connectors/dbConnector");

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
  console.log(
    `${username} sent a message to chat ${chat.type}: ${
      text ? text.length > 50 ? text.substring(0, 50) + "..."  : text : "No text provided"
    }`
  );

  const userStatus = await verificationService.verifyUser(userId, username);

  if (chat.type === "group" || chat.type === "supergroup") {
    await handleGroupMessage(userStatus, chatId, msg.message_id, username);
  } else if (chat.type === "private") {
    await handlePrivateMessage(userStatus, chatId, text, userId, username);
  }
}

async function handleGroupMessage(userStatus, chatId, messageId, username) {
  if (!userStatus.verified) {
    // Delete the message from the group
    await bot.deleteMessage(chatId, messageId.toString()).catch(console.error);
    sendTemporaryMessage(bot, chatId, `@${username} ${config.messages.verifyPromptGroup}`, 20000)

    return;
  }
}

async function handlePrivateMessage(userStatus, chatId, text, userId, username) {
  if (!userStatus.verified) {
    if (!userStatus.allowed) {
        await bot.sendMessage(chatId, config.messages.maxAttemptReached).catch(console.error);
        return;
    }

    if (text === "/verify" || text === "/start") {
      console.log(`Prompting CAPTCHA for ${username}`);
      await bot.sendMessage(chatId, config.messages.welcome + userStatus.captcha).catch(console.error);
      return;
    }
    // Handle CAPTCHA response
    if (text.match(/^[a-zA-Z0-9]*\.?\d*$/)) {
      if (text === userStatus.answer) {
        console.log(`${username} answers CAPTCHA correctly`);
        try {
          await verificationService.setUserVerified(userId);
          await bot.sendMessage(chatId, config.messages.verificationComplete);
        } catch (error) {
          console.error("Failed to set user as verified:", error);
          await bot.sendMessage(chatId, config.messages.verificationError).catch(console.error);
        }
      } else {
        console.log(`Prompting CAPTCHA for ${username} again due to incorrect response`);
        try {
          let newCaptcha = verificationService.getRandomCaptcha(); // show a new CAPTCHA in case of wrong answer
          await db.query(
            `UPDATE ${config.USERS_TABLE_NAME} SET current_captcha_id = ?, current_captcha_answer = ? WHERE userId = ?`,
            [newCaptcha.id, newCaptcha.answer, userId]
          );
          bot.sendMessage(chatId, config.messages.incorrectResponse(userStatus.attempts) + newCaptcha.question);
        } catch (error) {
          console.error("Failed to update CAPTCHA info:", error);
          bot.sendMessage(chatId, config.messages.verificationError);
        }
      }
    } else {
      await bot.sendMessage(chatId, config.messages.startVerification).catch(console.error);
    }
  } else {
    await bot.sendMessage(userId, config.messages.verificationComplete).catch(console.error);
  }
}

function handleNewMembers(msg) {
  msg.new_chat_members.forEach((member) => {
    console.log(`New member added: ${member.username} (ID: ${member.id})`);
  });
}

function handleLeftMember(msg) {
    const leftUser = msg.left_chat_member;
    console.log(`Member left or was removed: ${leftUser.username} (ID: ${leftUser.id})`);

    // Reset verification status when a user leaves the chat
    resetUserVerification(leftUser.id).catch(console.error);
}

async function resetUserVerification(userId) {
    try {
        const result = await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET verified = FALSE, attempts = 0 WHERE userId = ?`, [userId]);
        if (result.affectedRows > 0) {
            console.log(`Verification status reset for user ID: ${userId}`);
            // Optionally clear any cached verification status if applicable
            if (verifiedUsersCache[userId]) {
                verifiedUsersCache[userId] = {
                    verified: false,
                    allowed: true,
                    attempts: 0,
                    captcha: null
                };
            }
        }
    } catch (error) {
        console.error(`Failed to reset verification for user ID ${userId}:`, error);
        throw error;
    }
}

async function sendTemporaryMessage(bot, chatId, message, timeoutMs) {
    try {
        // Send the message
        const sentMessage = await bot.sendMessage(chatId, message);
        const messageId = sentMessage.message_id;
        // Schedule deletion of the message after timeoutMs milliseconds
        setTimeout(async () => {
            try {
                await bot.deleteMessage(chatId, messageId);
            } catch (error) {
                console.error(`Failed to delete message: ${messageId}`, error);
            }
        }, timeoutMs);
    } catch (error) {
        console.error('Failed to send or schedule deletion for message', error);
    }
}

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at:", p, "reason:", reason);
});

process.on("SIGINT", () => bot.stopPolling().then(() => process.exit()));
process.on("SIGTERM", () => bot.stopPolling().then(() => process.exit()));

module.exports = bot;
