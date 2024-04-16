module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    messages: {
        verifyPromptGroup: `Для участі в чаті, будь ласка, пройдіть верифікацію за допомогою нашого чат бота ${process.env.BOT_URL}`,
        maxAttemptReached: 'Ви досягли максимальної кількості спроб верифікації. Будь ласка, спробуйте пізніше.',
        welcome: 'Ласкаво просимо! Будь ласка, надайте правильну відповідь, щоб продовжити: ',
        incorrectResponse: (attempts) => `Неправильна відповідь. Спроба ${attempts}: `,
        verificationComplete: 'Ви пройшли верифікацію. Вітаємо у чаті!',
        startVerification: 'Будь ласка, введіть /verify, щоб почати перевірку.',
        verificationError: 'Виникла помилка. Будь ласка, спробуйте ще раз.'
    },
    captchas: [
        { id: "1", question: "Скільки федеральних земель (Bundesländer) має Австрія?", answer: "9" },
        { id: "2", question: "У якому році Україна здобула незалежність від Радянського Союзу?", answer: "1991" },
        { id: "3", question: "Який порт за замовчуванням використовується для HTTPS?", answer: "443" },
        { id: "4", question: "Який код статусу HTTP дорівнює 'Not Found'?", answer: "404" },
        { id: "5", question: "Скільки бітів у байті", answer: "8" },
        { id: "6", question: "Яка ставка єдиного податку для ФОП на третій групі в Україні?", answer: "5" },
        { id: "7", question: "Яке найменше просте число?", answer: "2" },
        { id: "8", question: "Чому дорівнює сума кутів у трикутнику в градусах?", answer: "180" },
        { id: "9", question: "У масиві, що починається з індексу 1, за яким індексом знаходиться четвертий елемент?", answer: "4" },
        { id: "10", question: "Скільки первинних ключів може мати одна таблиця в реляційній базі даних?", answer: "1" },
        { id: "11", question: "Який стандартний номер порту для HTTP?", answer: "80" }

    ],
    MAX_ATTEMPTS: 10,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
