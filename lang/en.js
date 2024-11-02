module.exports = {
    messages: {
        verifyPromptGroup: (username) => `Herzlich Willkommen, ${username ? `@${username}` : 'newcomer'}! Prove you are a human to join the conversation: ${process.env.BOT_URL}.`,
        maxAttemptReached: "You have reached the maximum number of attempts. Bitte versuchen later.",
        welcome: "Ласкаво просимо! Please provide the correct numerical answer to continue:\n",
        incorrectResponse: "Falsche Antwort. Try again: ",
        verificationComplete: "Verification successful. Herzlich willkommen!",
        verificationError: "Oops, something went wrong. Let's try again...",
        copyPasteFromCache: "Here are the messages you tried to send earlier.\nYou can copy them and paste them back into the chat:",
        banSpammersComplete: (spammers) => `✈️ Bounced ${spammers} ${spammers === 1 ? 'suspicious account' : 'suspicious accounts'}. Spot an error? Contact ${process.env.BOT_URL} 🦘🦘🦘`,
        thanksMessage: "Danke sehr! Enjoy the conversation!",
    },
    captchas: [
        { id: "1", question: "What is the index number of the first element in an array?", answer: "0" },
        { id: "2", question: "What has to be broken before you can use it?\n1. A door\n2. A glass\n3. A promise", answer: "2" },
        { id: "3", question: "Why can't a programmer find love?\n1. He is always debugging\n2. He thinks all relationships are iterations\n3. He's afraid of commits", answer: "3" },
        { id: "4", question: "Why do programmers prefer dark mode?\n1. It's easier for the eyes\n2. They are vampires\n3. Because light attracts bugs", answer: "3" },
        { id: "5", question: "How many values can a boolean type represent?", answer: "2" },
        { id: "6", question: "What is the smallest primitive number?", answer: "2" },
        { id: "7", question: "What is the sum of the angles in a triangle (in degrees)?", answer: "180" },
        { id: "8", question: "What comes once in a minute, twice in a moment, but never in a thousand years?\n1. A comet\n2. A second\n3. The letter m", answer: "3" },
        { id: "9", question: "Why did the developer run out of money?\n1. Insufficient funds\n2. Spent all his cache\n3. Lost a bet", answer: "2" },
        { id: "10", question: "What is the default port for HTTP?", answer: "80" }
    ]
};
