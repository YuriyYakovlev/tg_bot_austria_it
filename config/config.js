module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    messages: {
        verifyPromptGroup: (username) => `Herzlich Willkommen, ${username ? `@${username}` : 'newcomer'}!\nProve you are a human to join the conversation: ${process.env.BOT_URL}.`,
        maxAttemptReached: 'Ви досягли максимальної кількості спроб. Bitte versuchen пізніше.',
        welcome: 'Ласкаво просимо! Bitte geben Sie die richtige числову відповідь, щоб продовжити:\n',
        incorrectResponse: 'Falsche Antwort. Спробуйте ще раз: ',
        verificationComplete: 'Ви пройшли верифікацію. Herzlich willkommen!',
        verificationError: 'От халепа, etwas ist schief gelaufen. Спробуймо ще раз...',
        copyPasteFromCache: 'Here are the messages you tried to send earlier.\nYou can copy them and paste back into the chat:',
        banSpammersComplete: (spammers) => `✈️ Bounced ${spammers} ${spammers === 1 ? 'suspicious account' : 'suspicious accounts'}.\nSpot an error? Kontaktieren Sie ${process.env.BOT_URL}`,
        thanksMessage: 'Danke sehr! Приємного спілкування!',
    },
    captchas: [
        { id: "1", question: "What is the index number of the first element in an array?", answer: "0" },
        { id: "2", question: "What has to be broken before you can use it?\n1. A door\n2. A glass\n3. A promise", answer: "2" },
        { id: "3", question: "Чому програміст не може знайти любов?\n1. Він весь час дебажить\n2. Він думає, що всі відносини - це ітерації\n3. Він боїться комітів", answer: "3" },
        { id: "4", question: "Why do programmers prefer dark mode?\n1. It's easier for the eyes\n2. They are vampires\n3. Because light attracts bugs", answer: "3" },
        { id: "5", question: "Скільки значень може представляти тип boolean?", answer: "2" },
        { id: "6", question: "Was ist die kleinste primitive Zahl?", answer: "2" },
        { id: "7", question: "What is the sum of the angles in a triangle (in degrees)?", answer: "180" },
        { id: "8", question: "What comes once in a minute, twice in a moment, but never in a thousand years?\n1. A comet\n2. A second\n 3. The letter m\n", answer: "3" },
        { id: "9", question: "Чому розробник залишився без грошей?\n1. Недостатньо коштів\n2. Витратив весь свій кеш\n3. Програв у парі", answer: "2" },
        { id: "10", question: "Was ist der Standard-Port für HTTP?", answer: "80" }
    ],
    MAX_ATTEMPTS: 10,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
