module.exports = {
    dbConfig: {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DATABASE: process.env.DB_NAME
    },
    messages: {
        verifyPromptGroup: (username) => `Вітаємо тебе, ${username ? `@${username}`: 'новоприбулець'}.\nБудь ласка, пройди верифікацію за допомогою нашого чат бота ${process.env.BOT_URL}`,
        maxAttemptReached: 'Ви досягли максимальної кількості спроб. Bitte versuchen пізніше.',
        welcome: 'Ласкаво просимо! Bitte geben Sie die richtige числову відповідь, щоб продовжити:\n',
        incorrectResponse: 'Falsche Antwort. Спробуйте ще раз: ',
        verificationComplete: 'Ви пройшли верифікацію. Herzlich willkommen!',
        verificationError: 'От халепа, etwas ist schief gelaufen. Спробуймо ще раз...',
        copyPasteFromCache: 'Ось повідомлення, які ви намагалися надіслати раніше.\nМожете скопіювати їх і вставити назад у чат:',
        banSpammersComplete: (spammers) => `Видалено ${spammers} ${spammers === 1 ? 'підозрілий акаунт' : 'підозрілих акаунтів'}.\nПобачили помилку? Kontaktieren Sie ${process.env.BOT_URL}`,
        thanksMessage: 'Danke sehr! Приємного cпілкування!',
    },
    captchas: [
        { id: "1", question: "What is the index number of the first element of an array?", answer: "0" },
        { id: "2", question: "What is the default port for HTTPS?", answer: "443" },
        { id: "3", question: "Чому програміст не може знайти любов?\n1. Він весь час дебажить\n2. Він думає, що всі відносини - це ітерації\n3. Він боїться комітів", answer: "3" },
        { id: "4", question: "Чому програмісти віддають перевагу темному режиму?\n1. Він легше для очей\n2. Вони вампіри\n3. Тому що світло приваблює баги", answer: "3" },
        { id: "5", question: "Сколько значений может представлять тип boolean?", answer: "2" },
        { id: "6", question: "Was ist die kleinste primitive Zahl?", answer: "2" },
        { id: "7", question: "Какова сумма углов треугольника (в градусах)?", answer: "180" },
        { id: "8", question: "Який індекс четвертого елемента у масиві з п'яти елементів?", answer: "3" },
        { id: "9", question: "Чому розробник залишився без грошей?\n1. Недостатньо коштів\n2. Витратив весь свій кеш\n3. Програв у парі", answer: "2" },
        { id: "10", question: "Was ist der Standard-Port für HTTP?", answer: "80" }
    ],
    MAX_ATTEMPTS: 10,
    USERS_TABLE_NAME: process.env.NODE_ENV === 'production' ? 'users' : 'users_test'
};
