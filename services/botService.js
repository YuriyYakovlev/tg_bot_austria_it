const TelegramBot = require('node-telegram-bot-api');
const verificationService = require('./verificationService');
const config = require('../config/config');
const db = require('../db/connectors/dbConnector');

const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;
    const username = msg.from.username || null;

    try {
        const { verified, allowed, attempts, captcha, answer } = await verificationService.verifyUser(userId, username);

        if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
            if (!verified) {
                // Delete the message from the group
                bot.deleteMessage(chatId, msg.message_id.toString()).catch(error => {
                    console.error('Failed to delete message:', error);
                });

                if (allowed) {
                    bot.sendMessage(userId, config.messages.verifyPrompt);
                } else {
                    bot.sendMessage(userId, config.messages.maxAttemptReached);
                }
                return;
            }
        }

        console.log(`${username} sent a message in chat type: ` + msg.chat.type);
        if (msg.chat.type === 'private') {
            if (!verified) {
                if (!allowed) {
                    bot.sendMessage(chatId, config.messages.maxAttemptReached);
                    return;
                }
                // Handle '/verify' command specifically to start or restart the CAPTCHA challenge
                if (messageText === '/verify') {
                    console.log(`Prompting CAPTCHA for ${username}`);
                    bot.sendMessage(chatId, config.messages.welcome + captcha);
                    return;
                }
                // Handle CAPTCHA response
                if (messageText.match(/^\d+$/)) {
                    if (messageText === answer) {
                        console.log(`${username} answers CAPTCHA correctly`);
                        await verificationService.setUserVerified(userId);
                        bot.sendMessage(chatId, config.messages.verificationComplete);
                    } else {
                        console.log(`Prompting CAPTCHA for ${username} again due to incorrect response`);
                        let newCaptcha = verificationService.getRandomCaptcha(); // show a new CAPTCHA in case of wrong answer
                        await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET current_captcha_id = ?, current_captcha_answer = ? WHERE userId = ?`, [newCaptcha.id, newCaptcha.answer, userId]);
                        
                        bot.sendMessage(chatId, config.messages.incorrectResponse(attempts, config.MAX_ATTEMPTS) + newCaptcha.question);
                    }
                } else {
                    bot.sendMessage(chatId, config.messages.startVerification);
                }
            } else {
                bot.sendMessage(userId, config.messages.verificationComplete);
            }
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
    }
});


module.exports = bot;
