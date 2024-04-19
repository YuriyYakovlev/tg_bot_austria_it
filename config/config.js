module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    messages: {
        verifyPromptGroup: `верифицирен зи битте ${process.env.BOT_URL}`,
        maxAttemptReached: 'Ви досягли максимальної кількості Ферзухів. Bitte versuchen пізніше.',
        welcome: 'Ласкаво просимо! Bitte geben Sie die richtige Antwort, щоб продовжити: ',
        incorrectResponse: 'Falsche Antwort. Спробуйте ще раз: ',
        verificationComplete: 'Ви пройшли верифікацію. Herzlich willkommen!',
        startVerification: 'Будь ласка, geben Sie /verify, щоб почати перевірку.',
        verificationError: 'От халепа, etwas ist schief gelaufen. Спробуймо ще раз...',
        copyPasteFromCache: 'Ось повідомлення, які ви намагалися надіслати раніше.\nМожете скопіювати їх і вставити назад у чат:',
        banSpammersComplete: (spammers) => `Видалено ${spammers} ${spammers === 1 ? 'спам бота' : 'спам ботів'}.\nПобачили помилку? Kontaktieren Sie ${process.env.BOT_URL}`,
        thanksMessage: 'Danke sehr! Приємного cпілкування!',
    },
    captchas: [
        { id: "1", question: "What is the index number of the first element of an array in most programming languages?", answer: "0" },
        { id: "2", question: "What is the default port for HTTPS?", answer: "443" },
        { id: "3", question: "What is the HTTP status code for 'Not Found'?", answer: "404" },
        { id: "4", question: "How many bits in a byte?", answer: "8" },
        { id: "5", question: "How many values can the boolean type represent?", answer: "2" },
        { id: "6", question: "What is the smallest primitive number?", answer: "2" },
        { id: "7", question: "What is the sum of the angles in a triangle in degrees?", answer: "180" },
        { id: "8", question: "In an array starting at index 1, what is the index of the fourth element?", answer: "4" },
        { id: "9", question: "How many primary keys can one table have in a relational database?", answer: "1" },
        { id: "10", question: "What is the default port number for HTTP?", answer: "80" }
    ],
    MAX_ATTEMPTS: 10,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
