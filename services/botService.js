// botService.js
const TelegramBot = require("node-telegram-bot-api");
const userVerificationService = require("./userVerificationService");
const spamDetectionService = require("./spamDetectionService");
const userModerationService = require("./userModerationService");
const groupMessageService = require("./groupMessageService");
const privateMessageService = require("./privateMessageService");
const callbackService = require("./callbackService");
const mentionService = require("./mentionService");
const config = require("../config/config");

const eventsService = require("../extras/eventsService");
const newsService = require("../extras/newsService");
const vacanciesService = require("../extras/vacanciesService");
const eduService = require("../extras/eduService");

let bot;
const userSessionData = new Map(); // Stores { userId: { chatId, promptTime, chat_username, thread_id } }

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
      if (msg.left_chat_member) handleLeftMember(msg);
      if (msg.reply_to_message && msg.text && msg.text.includes(`${process.env.BOT_URL}`)) {
        await mentionService.handleMentionedMessage(bot, msg);
      } else {
        await handleMessage(msg);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  bot.on("callback_query", async (callbackQuery) => {
    try {
        await callbackService.processCallbackQuery(bot, callbackQuery, userSessionData);
    } catch (error) {
        console.error("Error processing callback query:", error);
    }
  });

  bot.on("polling_error", (error) => {
    //console.error("Polling error");
    if (error.code === 'EFATAL' || error.message.includes('ECONNRESET')) {
      handleRetry(retryCount, MAX_RETRIES);
    } else if (error.code === 'ETELEGRAM' && error.message.includes('502 Bad Gateway')) {
      //console.error("Telegram server error, will retry polling...");
      handleRetry(retryCount, MAX_RETRIES);
    }
  });
}

function handleRetry(retryCount, maxRetries) {
  if (retryCount < maxRetries) {
    const delay = 5000 * Math.pow(2, retryCount);
    //console.log(`Attempting to restart polling after ${delay} ms...`);
    bot.stopPolling() // Ensure polling is stopped before retrying
      .then(() => {
        //console.log("Polling stopped successfully.");
        setTimeout(() => startBotPolling(retryCount + 1), delay);
        //console.log("Restarting polling.");
      })
      .catch(error => {
        console.error("Error stopping polling:", error);
        setTimeout(() => startBotPolling(retryCount + 1), delay);
      });
  } else {
    //console.error("Max retries reached, stopping the bot");
    process.exit(1);
  }
}

// to avoid conflicts between old still running cloud run instances
setTimeout(() => {
  startBotPolling();
  cleanup();
}, 10000);


async function handleMessage(msg) {
  const { chat } = msg;
  
  if (chat.type === "group" || chat.type === "supergroup") {
    await groupMessageService.handleGroupMessage(bot, msg, userSessionData);
  } else if (chat.type === "private") {
    await privateMessageService.handlePrivateMessage(bot, msg);
  }
}

function handleLeftMember(msg) {
    const leftUser = msg.left_chat_member;
    try {
      console.log("Member left or was removed:", JSON.stringify(leftUser, null, 2));
      if (leftUser.id) {
        userVerificationService.resetUserVerification(leftUser.id).catch(console.error);
      }
    } catch (error) {
      console.error(`handleLeftMember`, error.message);
    }
}

async function cleanup() {
  try {
    await spamDetectionService.classifyMessages();
    await userModerationService.kickSpammers(bot);
    userVerificationService.cleanupUserAttempts();
    userVerificationService.cleanupVerifiedUsersCache();
  } catch (error) {
    console.error('Error while performing cleanup:', error.message);
  }
}

async function postUpcomingEvents() {
  try {
    const events = await eventsService.fetchUpcomingEvents();
    if (!events) {
      console.log("No upcoming events found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.EVENTS_THREAD_ID; 
    
    await bot.sendMessage(chatId, events, {
        message_thread_id: threadId
    });
  } catch (error) {
    console.error("Error posting monthly events:", error.message);
  }
}

async function postNewsDigest() {
  try {
    const news = await newsService.fetchNewsDigest();
    if (!news) {
      console.log("No upcoming events found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.NEWS_THREAD_ID; 
    
    await bot.sendMessage(chatId, news, {
        message_thread_id: threadId,
        parse_mode: "HTML"
    });
  } catch (error) {
    console.error("Error posting monthly events:", error.message);
  }
}

async function postNewVacancies() {
  try {
    const vacancies = await vacanciesService.fetchNewVacancies();
    if (!vacancies) {
      console.log("No new vacancies found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.VACANCIES_THREAD_ID; 
    
    await bot.sendMessage(chatId, vacancies, {
        message_thread_id: threadId,
        parse_mode: "HTML"
    });
  } catch (error) {
    console.error("Error posting new vacancies:", error.message);
  }
}

async function postWordOfTheDay() {
  try {
    const wordOfTheDay = await eduService.fetchWordOfTheDay();
    if (!wordOfTheDay) {
      console.log("No word of the day found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.EDU_THREAD_ID; 
    
    const message = `<u>Слово дня</u>: <b>${wordOfTheDay.word}</b>\n<i>${wordOfTheDay.description}</i>`;

    await bot.sendMessage(chatId, 
      message,
      {
        message_thread_id: threadId,
        parse_mode: "HTML"
      });
  } catch (error) {
    console.error("Error posting new vacancies:", error.message);
  }
}

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

module.exports = { 
  postUpcomingEvents,
  postNewsDigest,
  postNewVacancies,
  postWordOfTheDay
};
