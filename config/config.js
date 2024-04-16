module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    messages: {
        verifyPromptPrivate: 'Будь ласка, введіть /verify, щоб почати процес верифікації.',
        verifyPromptGroup: `Будь ласка, пройдіть верифікацію за допомогою нашого чат бота ${process.env.BOT_URL}`,
        maxAttemptReached: 'Ви досягли максимальної кількості спроб верифікації. Будь ласка, спробуйте пізніше.',
        welcome: 'Ласкаво просимо! Будь ласка, надайте правильну відповідь, щоб продовжити: ',
        incorrectResponse: (attempts) => `Неправильна відповідь. Спроба ${attempts}. Будь ласка, надайте правильну відповідь, щоб продовжити: `,
        verificationComplete: 'Ви пройшли верифікацію! Ви можете брати участь у чаті.',
        startVerification: 'Будь ласка, введіть /verify, щоб почати перевірку.',
        verificationError: 'Виникла помилка. Будь ласка, спробуйте ще раз.'
    },
    captchas: [
        { id: "1", question: "Скільки буде, якщо до 2 додати 14?", answer: "16" },
        { id: "2", question: "Скільки буде половина від 100?", answer: "50" },
        { id: "3", question: "Помножте 4 на 3", answer: "12" },
        { id: "4", question: "Розділіть 20 на 5", answer: "4" },
        { id: "5", question: "Чому дорівнює сума чисел 14 і 29?", answer: "43" },
        { id: "6", question: "Яка ставка єдиного податку для ФОП на третій групі в Україні?", answer: "5" }
    ],
    MAX_ATTEMPTS: 10,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
