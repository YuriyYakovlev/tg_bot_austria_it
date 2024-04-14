module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    messages: {
        verifyPrompt: 'Будь ласка, введіть /verify, щоб почати процес верифікації.',
        maxAttemptReached: 'Ви досягли максимальної кількості спроб верифікації. Будь ласка, спробуйте пізніше.',
        welcome: 'Ласкаво просимо! Будь ласка, надайте правильну відповідь, щоб продовжити: ',
        incorrectResponse: (attempts, maxAttempts) => `Неправильна відповідь. Спроба ${attempts} від ${maxAttempts}. Будь ласка, надайте правильну відповідь, щоб продовжити: `,
        verificationComplete: 'Ви пройшли верифікацію! Ви можете брати участь у чаті.',
        startVerification: 'Будь ласка, введіть /verify, щоб почати перевірку.',
    },
    captchas: [
        { id: "1", question: "Скільки буде, якщо до 2 додати 14?", answer: "16" },
        { id: "2", question: "Скільки буде половина від 100?", answer: "50" },
        { id: "3", question: "Помножте 4 на 3", answer: "12" },
        { id: "4", question: "Розділіть 20 на 5", answer: "4" },
        { id: "5", question: "Чому дорівнює сума чисел 14 і 29?", answer: "43" }
    ],
    MAX_ATTEMPTS: 3,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};