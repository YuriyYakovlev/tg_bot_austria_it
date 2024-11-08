// callbackService.js
const userVerificationService = require("./userVerificationService");
const messagesCacheService = require("./messagesCacheService");
const languageService = require("./languageService");

async function processCallbackQuery(bot, callbackQuery, userSessionData) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = JSON.parse(callbackQuery.data);
    const { t, id, a, l } = data;

    await bot.answerCallbackQuery(callbackQuery.id);
    if (t === 'c') {
        const messages = languageService.getMessages(l).messages;
        const buttons = languageService.getMessages(l).buttons;
        
        const canAttempt = userVerificationService.recordUserAttempt(userId);
        if (!canAttempt) {
            await bot.sendMessage(chatId, messages.maxAttemptReached).catch(console.error);
            console.log(`sent max attepmt reached to ${userId}`);
            return;
        }

        let correctAnswer = await userVerificationService.getCaptchaAnswer(id, l);
        if (a.toString() === correctAnswer.toString()) {
            await handleCorrectAnswer(bot, chatId, userId, messages, buttons, userSessionData);
        } else {
            await handleIncorrectAnswer(bot, chatId, userId, a, l, messages);
        }
    }
}

async function handleCorrectAnswer(bot, chatId, userId, messages, buttons, userSessionData) {
    await userVerificationService.setUserVerified(userId);
    console.log(`${userId} solved CAPTCHA`);

    let finalMessage = messages.verificationComplete;
    const replyMarkup = { inline_keyboard: [] };

    const cachedMessages = await messagesCacheService.retrieveCachedMessages(userId);
    if (cachedMessages.length > 0) {
        finalMessage += `\n\n${messages.copyPasteFromCache}`;

        const cachedButtons = cachedMessages.map((message) => ({
            text: `${message.msg_text.substring(0, 50)}`,
            copy_text: { text: `${message.msg_text.substring(0, 256)}` },
        }));
        replyMarkup.inline_keyboard.push(cachedButtons);
        
        await messagesCacheService.deleteCachedMessages(cachedMessages.map(m => m.messageId));
    }

    const sessionData = userSessionData.get(userId);
    if (sessionData?.chat_username && sessionData.thread_id) {
        replyMarkup.inline_keyboard.push([{
            text: buttons.backToChat,
            url: `t.me/${sessionData.chat_username}/${sessionData.thread_id}`
        }]);
        
        userSessionData.delete(userId);
    }
    
    await bot.sendMessage(chatId, finalMessage, { reply_markup: replyMarkup });
}


async function handleIncorrectAnswer(bot, chatId, userId, a, l, messages) {
    await bot.sendMessage(chatId, messages.incorrectResponse);
    console.log(`${userId} answered CAPTCHA incorrectly: ${a}`);
    const newCaptcha = await userVerificationService.getRandomCaptcha(userId, l);
    const options = {
        reply_markup: {
            inline_keyboard: newCaptcha.inline_keyboard(l)
        }
    };
    await bot.sendMessage(chatId, newCaptcha.q, options).catch(console.error);
    console.log(`new CAPTCHA for ${userId}: ${newCaptcha.q.substring(0, 50)}`);
}

module.exports = { processCallbackQuery };
