const TelegramBot = require('node-telegram-bot-api');
const verificationService = require('./verificationService');
const config = require('../config/config');
const db = require('../db/connectors/dbConnector');

const bot = new TelegramBot(process.env.TG_TOKEN, {
    polling: {
        interval: 2000,
        autoStart: true,
        params: {
            timeout: 30
        }
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const messageText = msg.text;
    const username = msg.from.username || null;

    console.log(`${username} sent a message: ` + messageText);

    // Check if there are new members in this message
    if (msg.new_chat_members && msg.new_chat_members.length > 0) {
        msg.new_chat_members.forEach(member => {
            console.log(`New member added: ${member.username} (ID: ${member.id})`);
        });
    }

    // Check if a member has left or been removed
    if (msg.left_chat_member) {
        const leftUser = msg.left_chat_member;
        console.log(`Member left or was removed: ${leftUser.username} (ID: ${leftUser.id})`);
    }

    try {
        const { verified, allowed, attempts, captcha, answer } = await verificationService.verifyUser(userId, username);

        if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
            if (!verified) {
                // Delete the message from the group
                bot.deleteMessage(chatId, msg.message_id.toString()).catch(error => {
                    console.error('Failed to delete message:', error);
                });

                if (allowed) {
                    try {
                        bot.sendMessage(userId, config.messages.verifyPrompt);
                    } catch (error) {
                        console.error('Failed to send user a message.', error);
                    }
                } else {
                    console.log(`Max attempts reached for ${username}`);
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
                if (messageText.match(/^[a-zA-Z0-9]*\.?\d*$/)) {
                    if (messageText === answer) {
                        console.log(`${username} answers CAPTCHA correctly`);
                        try {
                            await verificationService.setUserVerified(userId);
                            bot.sendMessage(chatId, config.messages.verificationComplete);
                        } catch (error) {
                            console.error('Failed to set user as verified:', error);
                            bot.sendMessage(chatId, config.messages.verificationError);
                        }
                    } else {
                        console.log(`Prompting CAPTCHA for ${username} again due to incorrect response`);
                        try {
                            let newCaptcha = verificationService.getRandomCaptcha(); // show a new CAPTCHA in case of wrong answer
                            await db.query(`UPDATE ${config.USERS_TABLE_NAME} SET current_captcha_id = ?, current_captcha_answer = ? WHERE userId = ?`, [newCaptcha.id, newCaptcha.answer, userId]);
                            bot.sendMessage(chatId, config.messages.incorrectResponse(attempts) + newCaptcha.question);
                        } catch (error) {
                            console.error('Failed to update CAPTCHA info:', error);
                            bot.sendMessage(chatId, config.messages.verificationError);
                        }
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

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('SIGINT', () => bot.stopPolling().then(() => process.exit()));
process.on('SIGTERM', () => bot.stopPolling().then(() => process.exit()));

module.exports = bot;
