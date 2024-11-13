module.exports = {
    buttons: {
        start: "START",
        backToChat: "BACK TO CHAT"
    },
    messages: {
        verifyPromptGroup: (username) => `🦘 G'day, ${username ? `@${username}` : 'new friend'}! To jump into the conversation, please take a quick test.`,
        maxAttemptReached: (min) => `Looks like you've reached the max attempts. Take a breather and try again in ${min} minutes}!`,
        welcome: "Welcome aboard! Answer this to bounce into the chat.",
        incorrectResponse: "Nope, that's not quite it! Give it another shot:",
        verificationComplete: "Nice hop! You're in. Herzlich willkommen!",
        verificationError: "Yikes, there's a glitch in the pouch. Let's give that another go...",
        copyPasteFromCache: "Here's what you wanted to say earlier:",
        banSpammersComplete: (spammers) => `🦘 Tossed ${spammers} ${spammers === 1 ? 'sneaky spammer' : 'sneaky spammers'} out of the pouch.`,
        thanksMessage: "Danke sehr! Jump in and enjoy the conversation!",
        spamRemoved: "🦘 Aha, let's go hunting!",
        spamNotDetected: "🦘 Relax, boss, all clear!"
    },
    captchas: [
        {
            id: "1", 
            q: "What is the index number of the first element in an array?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "1", callback_data: JSON.stringify({ t: "c", id: "1", a: "1", l: language }) }],
                [{ text: "0", callback_data: JSON.stringify({ t: "c", id: "1", a: "2", l: language}) }],
                [{ text: "-1", callback_data: JSON.stringify({ t: "c", id: "1", a: "3", l: language }) }]
            ]
        },
        {
            id: "2", 
            q: "what is the speed of light in a vacuum?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "150,000 km/s", callback_data: JSON.stringify({ t: "c", id: "2", a: "1", l: language }) }],
                [{ text: "299,792,458 m/s", callback_data: JSON.stringify({ t: "c", id: "2", a: "2", l: language}) }],
                [{ text: "300,000 km/s", callback_data: JSON.stringify({ t: "c", id: "2", a: "3", l: language }) }]
            ]
        },
        {
            id: "3", 
            q: "Which planet is the largest in the solar system?",
            a: "4",
            inline_keyboard: (language) => [
                [{ text: "Earth", callback_data: JSON.stringify({ t: "c", id: "3", a: "1", l: language }) }],
                [{ text: "Venus", callback_data: JSON.stringify({ t: "c", id: "3", a: "2", l: language }) }],
                [{ text: "Mars", callback_data: JSON.stringify({ t: "c", id: "3", a: "3", l: language }) }],
                [{ text: "Jupiter", callback_data: JSON.stringify({ t: "c", id: "3", a: "4", l: language }) }],
                [{ text: "Saturn", callback_data: JSON.stringify({ t: "c", id: "3", a: "5", l: language }) }]
            ]
        },
        {
            id: "4", 
            q: "Who wrote the novel 'War and Peace'?",
            a: "2",
            inline_keyboard: (language) => [
                [{ text: "Fyodor Dostoevsky", callback_data: JSON.stringify({ t: "c", id: "4", a: "1", l: language }) }],
                [{ text: "Lev Tolstoy", callback_data: JSON.stringify({ t: "c", id: "4", a: "2", l: language }) }],
                [{ text: "Alexander Pushkin", callback_data: JSON.stringify({ t: "c", id: "4", a: "3", l: language }) }],
                [{ text: "Anton Chekhov", callback_data: JSON.stringify({ t: "c", id: "4", a: "4", l: language }) }],
                [{ text: "Ivan Turgenev", callback_data: JSON.stringify({ t: "c", id: "4", a: "5", l: language }) }]
            ]
        },
        {
            id: "5", 
            q: "How many values can a boolean t represent?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "0", callback_data: JSON.stringify({ t: "c", id: "5", a: "0", l: language }) }],
                [{ text: "1", callback_data: JSON.stringify({ t: "c", id: "5", a: "1", l: language}) }],
                [{ text: "2", callback_data: JSON.stringify({ t: "c", id: "5", a: "2", l: language }) }]
            ]
        },
        {
            id: "6", 
            q: "Which city is closest to the Eyjafjallajökull volcano?", 
            a: "0", 
            inline_keyboard: (language) => [
                [{ text: "Reykjavik", callback_data: JSON.stringify({ t: "c", id: "6", a: "0", l: language }) }],
                [{ text: "Kopavogur", callback_data: JSON.stringify({ t: "c", id: "6", a: "1", l: language}) }],
                [{ text: "Fjallabyggo", callback_data: JSON.stringify({ t: "c", id: "6", a: "2", l: language }) }]
            ]
        },
        {
            id: "7", 
            q: "What is the sum of the angles in a triangle?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "90", callback_data: JSON.stringify({ t: "c", id: "7", a: "1", l: language }) }],
                [{ text: "180", callback_data: JSON.stringify({ t: "c", id: "7", a: "2", l: language}) }],
                [{ text: "360", callback_data: JSON.stringify({ t: "c", id: "7", a: "3", l: language }) }]
            ]
        },
        {
            id: "8", 
            q: "What is the first letter of the English Alphabet?", 
            a: "3", 
            inline_keyboard: (language) => [
                [{ text: "A. C", callback_data: JSON.stringify({ t: "c", id: "8", a: "1", l: language }) }],
                [{ text: "B. D", callback_data: JSON.stringify({ t: "c", id: "8", a: "2", l: language}) }],
                [{ text: "C. A", callback_data: JSON.stringify({ t: "c", id: "8", a: "3", l: language }) }]
            ]
        },
        {
            id: "9", 
            q: "Which chemical element has the symbol 'O'?",
            a: "1",
            inline_keyboard: (language) => [
                [{ text: "Oxygen", callback_data: JSON.stringify({ t: "c", id: "9", a: "1", l: language }) }],
                [{ text: "Hydrogen", callback_data: JSON.stringify({ t: "c", id: "9", a: "2", l: language }) }],
                [{ text: "Sodium", callback_data: JSON.stringify({ t: "c", id: "9", a: "3", l: language }) }],
                [{ text: "Iron", callback_data: JSON.stringify({ t: "c", id: "9", a: "4", l: language }) }],
                [{ text: "Uranus", callback_data: JSON.stringify({ t: "c", id: "9", a: "5", l: language }) }]
            ]
        },
        {
            id: "10", 
            q: "Equal to roughly 746 watts, what animal-based unit is used to measure the rate at which work is done?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "Donkeystrength", callback_data: JSON.stringify({ t: "c", id: "10", a: "1", l: language}) }],
                [{ text: "Horsepower", callback_data: JSON.stringify({ t: "c", id: "10", a: "2", l: language }) }],
                [{ text: "Zebraforce", callback_data: JSON.stringify({ t: "c", id: "10", a: "3", l: language }) }]
            ]
        }
    ]
};
