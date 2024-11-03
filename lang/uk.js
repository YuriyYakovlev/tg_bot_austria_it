module.exports = {
    messages: {
        verifyPromptGroup: (username) => `Привіт, ${username ? `@${username}` : 'друже'}! 🦘 Щоб приєднатися до розмови, будь ласка, пройди невеликий тест: ${process.env.BOT_URL}`,
        maxAttemptReached: "Здається, ви вичерпали кількість спроб. Зробіть паузу і спробуйте знову пізніше!",
        welcome: "Ласкаво просимо! Оберіть правильну відповідь, щоб приєднатися до чату.\n",
        incorrectResponse: "Неправильно! Спробуйте ще раз: ",
        verificationComplete: "Чудовий стрибок! Ви всередині. Herzlich willkommen!",
        verificationError: "Ой, щось пішло не так. Спробуємо ще раз...",
        copyPasteFromCache: "Ось повідомлення, яке ви хотіли надіслати раніше! Скопіюйте і вставте, щоб продовжити розмову:",
        banSpammersComplete: (spammers) => `✈️ Видалено ${spammers} ${spammers === 1 ? 'підозрілий акаунт' : 'підозрілих акаунтів'}. Побачили помилку? Зв'яжіться з нами: ${process.env.BOT_URL} 🦘🦘🦘`,
        thanksMessage: "Danke sehr! Приємного спілкування!",
    },
    captchas: [
        {
            id: "1", 
            question: "Який індекс має перший елемент у масиві?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "1", callback_data: JSON.stringify({ type: "captcha", captchaId: "1", answer: "1", language }) }],
                [{ text: "0", callback_data: JSON.stringify({ type: "captcha", captchaId: "1", answer: "2", language}) }],
                [{ text: "-1", callback_data: JSON.stringify({ type: "captcha", captchaId: "1", answer: "3", language }) }]
            ]
        },
        {
            id: "2", 
            question: "Яка швидкість світла у вакуумі?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "150,000 км/с", callback_data: JSON.stringify({ type: "captcha", captchaId: "2", answer: "1", language }) }],
                [{ text: "299,792,458 м/с", callback_data: JSON.stringify({ type: "captcha", captchaId: "2", answer: "2", language}) }],
                [{ text: "300,000 км/с", callback_data: JSON.stringify({ type: "captcha", captchaId: "2", answer: "3", language }) }]
            ]
        },
        {
            id: "3", 
            question: "Чому програміст не може знайти кохання?", 
            answer: "3", 
            inline_keyboard: (language) => [
                [{ text: "Він постійно відлагоджує код", callback_data: JSON.stringify({ type: "captcha", captchaId: "3", answer: "1", language }) }],
                [{ text: "Він вважає, що всі стосунки – це ітерації", callback_data: JSON.stringify({ type: "captcha", captchaId: "3", answer: "2", language}) }],
                [{ text: "Він боїться комітів", callback_data: JSON.stringify({ type: "captcha", captchaId: "3", answer: "3", language }) }]
            ]
        },
        {
            id: "4", 
            question: "Чому програмісти надають перевагу темному режиму?", 
            answer: "3", 
            inline_keyboard: (language) => [
                [{ text: "Легше для очей", callback_data: JSON.stringify({ type: "captcha", captchaId: "4", answer: "1", language }) }],
                [{ text: "Вони вампіри", callback_data: JSON.stringify({ type: "captcha", captchaId: "4", answer: "2", language}) }],
                [{ text: "Бо світло приваблює баги", callback_data: JSON.stringify({ type: "captcha", captchaId: "4", answer: "3", language }) }]
            ]
        },
        {
            id: "5", 
            question: "Скільки значень може мати boolean тип?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "0", callback_data: JSON.stringify({ type: "captcha", captchaId: "5", answer: "0", language }) }],
                [{ text: "1", callback_data: JSON.stringify({ type: "captcha", captchaId: "5", answer: "1", language}) }],
                [{ text: "2", callback_data: JSON.stringify({ type: "captcha", captchaId: "5", answer: "2", language }) }]
            ]
        },
        {
            id: "6", 
            question: "Яке найменше примітивне число?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "0", callback_data: JSON.stringify({ type: "captcha", captchaId: "6", answer: "0", language }) }],
                [{ text: "1", callback_data: JSON.stringify({ type: "captcha", captchaId: "6", answer: "1", language}) }],
                [{ text: "2", callback_data: JSON.stringify({ type: "captcha", captchaId: "6", answer: "2", language }) }]
            ]
        },
        {
            id: "7", 
            question: "Скільки градусів у сумі внутрішніх кутів трикутника?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "90", callback_data: JSON.stringify({ type: "captcha", captchaId: "7", answer: "1", language }) }],
                [{ text: "180", callback_data: JSON.stringify({ type: "captcha", captchaId: "7", answer: "2", language}) }],
                [{ text: "360", callback_data: JSON.stringify({ type: "captcha", captchaId: "7", answer: "3", language }) }]
            ]
        },
        {
            id: "8", 
            question: "Яка перша літера англійського алфавіту?", 
            answer: "3", 
            inline_keyboard: (language) => [
                [{ text: "A. C", callback_data: JSON.stringify({ type: "captcha", captchaId: "8", answer: "1", language }) }],
                [{ text: "B. D", callback_data: JSON.stringify({ type: "captcha", captchaId: "8", answer: "2", language}) }],
                [{ text: "C. A", callback_data: JSON.stringify({ type: "captcha", captchaId: "8", answer: "3", language }) }]
            ]
        },
        {
            id: "9", 
            question: "Чому програміст залишився без грошей?", 
            answer: "2", 
            inline_keyboard: (language) => [
                [{ text: "Недостатньо коштів", callback_data: JSON.stringify({ type: "captcha", captchaId: "9", answer: "1", language }) }],
                [{ text: "Витратив весь кеш", callback_data: JSON.stringify({ type: "captcha", captchaId: "9", answer: "2", language}) }],
                [{ text: "Програв парі", callback_data: JSON.stringify({ type: "captcha", captchaId: "9", answer: "3", language }) }]
            ]
        },
        {
            id: "10", 
            question: "Який порт за замовчуванням для HTTP?", 
            answer: "1", 
            inline_keyboard: (language) => [
                [{ text: "80", callback_data: JSON.stringify({ type: "captcha", captchaId: "10", answer: "1", language }) }],
                [{ text: "8080", callback_data: JSON.stringify({ type: "captcha", captchaId: "10", answer: "2", language}) }],
                [{ text: "443", callback_data: JSON.stringify({ type: "captcha", captchaId: "10", answer: "3", language }) }]
            ]
        }
    ]
};
