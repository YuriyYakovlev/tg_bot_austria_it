module.exports = {
    buttons: {
        start: "START"
    },
    messages: {
        verifyPromptGroup: (username) => `🦘 G'day, ${username ? `@${username}` : 'new friend'}! To jump into the conversation, please take a quick test.`,
        maxAttemptReached: "Looks like you've reached the max attempts. Take a breather and try again soon!",
        welcome: "Welcome aboard! Answer this to bounce into the chat.\n",
        incorrectResponse: "Nope, that's not quite it! Give it another shot: ",
        verificationComplete: "Nice hop! You're in. Herzlich willkommen!",
        verificationError: "Yikes, there's a glitch in the pouch. Let's give that another go...",
        copyPasteFromCache: "Here's what you wanted to say earlier! Copy and paste to catch up in the convo:",
        banSpammersComplete: (spammers) => `🦘 Tossed ${spammers} ${spammers === 1 ? 'sneaky spammer' : 'sneaky spammers'} out of the pouch. See something off? Report it here @${process.env.BOT_URL}`,
        thanksMessage: "Danke sehr! Jump in and enjoy the conversation!",
        spamRemoved: "🦘 Inappropriate content removed!",
        spamNotDetected: "🦘 No issues detected."
    },
    captchas: [
        {
            id: "1", 
            question: "What is the index number of the first element in an array?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "1", callback_data: JSON.stringify({ type: "captcha", captchaId: "1", answer: "1", language }) }],
                [{ text: "0", callback_data: JSON.stringify({ type: "captcha", captchaId: "1", answer: "2", language}) }],
                [{ text: "-1", callback_data: JSON.stringify({ type: "captcha", captchaId: "1", answer: "3", language }) }]
            ]
        },
        {
            id: "2", 
            question: "what is the speed of light in a vacuum?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "150,000 km/s", callback_data: JSON.stringify({ type: "captcha", captchaId: "2", answer: "1", language }) }],
                [{ text: "299,792,458 m/s", callback_data: JSON.stringify({ type: "captcha", captchaId: "2", answer: "2", language}) }],
                [{ text: "300,000 km/s", callback_data: JSON.stringify({ type: "captcha", captchaId: "2", answer: "3", language }) }]
            ]
        },
        {
            id: "3", 
            question: "Why can't a programmer find love?", 
            answer: "3", 
            inline_keyboard: (language) => [
                [{ text: "He is always debugging", callback_data: JSON.stringify({ type: "captcha", captchaId: "3", answer: "1", language }) }],
                [{ text: "He thinks all relationships are iterations", callback_data: JSON.stringify({ type: "captcha", captchaId: "3", answer: "2", language}) }],
                [{ text: "He's afraid of commits", callback_data: JSON.stringify({ type: "captcha", captchaId: "3", answer: "3", language }) }]
            ]
        },
        {
            id: "4", 
            question: "Why do programmers prefer dark mode?", 
            answer: "3", 
            inline_keyboard: (language) => [
                [{ text: "It's easier for the eyes", callback_data: JSON.stringify({ type: "captcha", captchaId: "4", answer: "1", language }) }],
                [{ text: "They are vampires", callback_data: JSON.stringify({ type: "captcha", captchaId: "4", answer: "2", language}) }],
                [{ text: "Because light attracts bugs", callback_data: JSON.stringify({ type: "captcha", captchaId: "4", answer: "3", language }) }]
            ]
        },
        {
            id: "5", 
            question: "How many values can a boolean type represent?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "0", callback_data: JSON.stringify({ type: "captcha", captchaId: "5", answer: "0", language }) }],
                [{ text: "1", callback_data: JSON.stringify({ type: "captcha", captchaId: "5", answer: "1", language}) }],
                [{ text: "2", callback_data: JSON.stringify({ type: "captcha", captchaId: "5", answer: "2", language }) }]
            ]
        },
        {
            id: "6", 
            question: "Which city is closest to the Eyjafjallajökull volcano?", 
            answer: "0", 
            inline_keyboard: (language) => [
                [{ text: "Reykjavik", callback_data: JSON.stringify({ type: "captcha", captchaId: "6", answer: "0", language }) }],
                [{ text: "Kopavogur", callback_data: JSON.stringify({ type: "captcha", captchaId: "6", answer: "1", language}) }],
                [{ text: "Fjallabyggo", callback_data: JSON.stringify({ type: "captcha", captchaId: "6", answer: "2", language }) }]
            ]
        },
        {
            id: "7", 
            question: "What is the sum of the angles in a triangle?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "90", callback_data: JSON.stringify({ type: "captcha", captchaId: "7", answer: "1", language }) }],
                [{ text: "180", callback_data: JSON.stringify({ type: "captcha", captchaId: "7", answer: "2", language}) }],
                [{ text: "360", callback_data: JSON.stringify({ type: "captcha", captchaId: "7", answer: "3", language }) }]
            ]
        },
        {
            id: "8", 
            question: "What’s the first letter of the English Alphabet?", 
            answer: "3", 
            inline_keyboard: (language) => [
                [{ text: "A. C", callback_data: JSON.stringify({ type: "captcha", captchaId: "8", answer: "1", language }) }],
                [{ text: "B. D", callback_data: JSON.stringify({ type: "captcha", captchaId: "8", answer: "2", language}) }],
                [{ text: "C. A", callback_data: JSON.stringify({ type: "captcha", captchaId: "8", answer: "3", language }) }]
            ]
        },
        {
            id: "9", 
            question: "Why did the developer run out of money?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "Insufficient funds", callback_data: JSON.stringify({ type: "captcha", captchaId: "9", answer: "1", language }) }],
                [{ text: "Spent all his cache", callback_data: JSON.stringify({ type: "captcha", captchaId: "9", answer: "2", language}) }],
                [{ text: "Lost a bet", callback_data: JSON.stringify({ type: "captcha", captchaId: "9", answer: "3", language }) }]
            ]
        },
        {
            id: "10", 
            question: "Equal to roughly 746 watts, what animal-based unit is used to measure the rate at which work is done?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "Donkeystrength", callback_data: JSON.stringify({ type: "captcha", captchaId: "10", answer: "1", language}) }],
                [{ text: "Horsepower", callback_data: JSON.stringify({ type: "captcha", captchaId: "10", answer: "2", language }) }],
                [{ text: "Zebraforce", callback_data: JSON.stringify({ type: "captcha", captchaId: "10", answer: "3", language }) }]
            ]
        }
    ]
};
