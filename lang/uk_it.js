module.exports = {
    buttons: {
        start: "СТАРТ",
        backToChat: "ПОВЕРНУТИСЬ В ЧАТ"
    },
    messages: {
        verifyPromptGroup: (username) => `🦘 Привіт, ${username ? `@${username}` : 'друже'}! Щоб заскочити до розмови, будь ласка, пройди невеликий тест.`,
        maxAttemptReached: (min) => `Здається, ви вичерпали кількість спроб. Зробіть паузу і спробуйте знову через ${min} хвилин!`,
        welcome: "Ласкаво просимо! Оберіть правильну відповідь, щоб приєднатися до чату.",
        incorrectResponse: "Неправильно! Спробуйте ще раз:",
        verificationComplete: "Чудовий стрибок! Ви всередині. Herzlich willkommen!",
        verificationError: "Ой, щось пішло не так. Спробуємо ще раз...",
        copyPasteFromCache: "Ось повідомлення, які ви хотіли надіслати раніше:",
        banSpammersComplete: (spammers) => `🦘 Видалено ${spammers} ${spammers === 1 ? 'підозрілий акаунт' : 'підозрілих акаунтів'}.`,
        thanksMessage: "Danke sehr! Приємного спілкування!",
        spamRemoved: "🦘 Ага, йдемо на полювання!",
        spamNotDetected: "🦘 Спокійно, шеф, все чисто!"
    },
    captchas: [
        {
            id: "1", 
            q: "Який індекс має перший елемент у масиві?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "1", callback_data: JSON.stringify({ t: "c", id: "1", a: "1", l: language }) }],
                [{ text: "0", callback_data: JSON.stringify({ t: "c", id: "1", a: "2", l: language }) }],
                [{ text: "-1", callback_data: JSON.stringify({ t: "c", id: "1", a: "3", l: language }) }],
                [{ text: "2", callback_data: JSON.stringify({ t: "c", id: "1", a: "4", l: language }) }],
                [{ text: "10", callback_data: JSON.stringify({ t: "c", id: "1", a: "5", l: language }) }]
            ]
        },
        {
            id: "2", 
            q: "Який тип тестування застосовується для оцінки частин коду без залежностей?", 
            a: "3", 
            inline_keyboard: (language) => [
                [{ text: "Функціональне тестування", callback_data: JSON.stringify({ t: "c", id: "2", a: "1", l: language }) }],
                [{ text: "Інтеграційне тестування", callback_data: JSON.stringify({ t: "c", id: "2", a: "2", l: language }) }],
                [{ text: "Юніт-тестування", callback_data: JSON.stringify({ t: "c", id: "2", a: "3", l: language }) }],
                [{ text: "Рефакторинг", callback_data: JSON.stringify({ t: "c", id: "2", a: "4", l: language }) }],
                [{ text: "Негативне тестування", callback_data: JSON.stringify({ t: "c", id: "2", a: "5", l: language }) }]
            ]
        },
        {
            id: "3", 
            q: "Який з наступних принципів програмування означає повторне використання коду?",
            a: "5",
            inline_keyboard: (language) => [
                [{ text: "Інкапсуляція", callback_data: JSON.stringify({ t: "c", id: "3", a: "1", l: language }) }],
                [{ text: "Поліморфізм", callback_data: JSON.stringify({ t: "c", id: "3", a: "2", l: language }) }],
                [{ text: "Рекурсія", callback_data: JSON.stringify({ t: "c", id: "4", a: "3", l: language }) }],
                [{ text: "Абстракція", callback_data: JSON.stringify({ t: "c", id: "3", a: "4", l: language }) }],
                [{ text: "Наслідування", callback_data: JSON.stringify({ t: "c", id: "3", a: "5", l: language }) }]
            ]
        },
        {
            id: "4", 
            q: "Скільки байт містить один кілобайт (у традиційній системі обчислення)?",
            a: "2",
            inline_keyboard: (language) => [
                [{ text: "1000", callback_data: JSON.stringify({ t: "c", id: "4", a: "1", l: language }) }],
                [{ text: "1024", callback_data: JSON.stringify({ t: "c", id: "4", a: "2", l: language }) }],
                [{ text: "512", callback_data: JSON.stringify({ t: "c", id: "4", a: "3", l: language }) }],
                [{ text: "2048", callback_data: JSON.stringify({ t: "c", id: "4", a: "4", l: language }) }],
                [{ text: "4096", callback_data: JSON.stringify({ t: "c", id: "4", a: "5", l: language }) }]
            ]
        },
        {
            id: "5", 
            q: "Скільки значень може мати boolean тип?", 
            a: "4", 
            inline_keyboard: (language) => [
                [{ text: "0", callback_data: JSON.stringify({ t: "c", id: "5", a: "1", l: language }) }],
                [{ text: "1", callback_data: JSON.stringify({ t: "c", id: "5", a: "2", l: language }) }],
                [{ text: "5", callback_data: JSON.stringify({ t: "c", id: "5", a: "3", l: language }) }],
                [{ text: "2", callback_data: JSON.stringify({ t: "c", id: "5", a: "4", l: language }) }],
                [{ text: "10", callback_data: JSON.stringify({ t: "c", id: "5", a: "5", l: language }) }]
            ]
        },
        {
            id: "6", 
            q: "Який з наступних термінів стосується механізму приховування внутрішніх деталей реалізації об'єкта?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "Поліморфізм", callback_data: JSON.stringify({ t: "c", id: "6", a: "1", l: language }) }],
                [{ text: "Інкапсуляція", callback_data: JSON.stringify({ t: "c", id: "6", a: "2", l: language }) }],
                [{ text: "Рекурсія", callback_data: JSON.stringify({ t: "c", id: "6", a: "3", l: language }) }],
                [{ text: "Абстракція", callback_data: JSON.stringify({ t: "c", id: "6", a: "4", l: language }) }],
                [{ text: "Наслідування", callback_data: JSON.stringify({ t: "c", id: "6", a: "5", l: language }) }]
            ]
        },
        {
            id: "7", 
            q: "Скільки градусів у сумі внутрішніх кутів трикутника?", 
            a: "4", 
            inline_keyboard: (language) => [
                [{ text: "90", callback_data: JSON.stringify({ t: "c", id: "7", a: "1", l: language }) }],
                [{ text: "360", callback_data: JSON.stringify({ t: "c", id: "7", a: "3", l: language }) }],
                [{ text: "120", callback_data: JSON.stringify({ t: "c", id: "7", a: "3", l: language }) }],
                [{ text: "180", callback_data: JSON.stringify({ t: "c", id: "7", a: "4", l: language }) }],
                [{ text: "270", callback_data: JSON.stringify({ t: "c", id: "7", a: "5", l: language }) }]
            ]
        },
        {
            id: "8", 
            q: "Для чого використовується Jira?", 
            a: "3", 
            inline_keyboard: (language) => [
                [{ text: "Для управління версіями", callback_data: JSON.stringify({ t: "c", id: "8", a: "1", l: language }) }],
                [{ text: "Для дизайну", callback_data: JSON.stringify({ t: "c", id: "8", a: "2", l: language }) }],
                [{ text: "Для управління проєктами", callback_data: JSON.stringify({ t: "c", id: "8", a: "3", l: language }) }],
                [{ text: "Для мобільного дизайну", callback_data: JSON.stringify({ t: "c", id: "8", a: "4", l: language }) }],
                [{ text: "Для верстки", callback_data: JSON.stringify({ t: "c", id: "8", a: "5", l: language }) }]
            ]
        },
        {
            id: "9", 
            q: "Який математичний оператор використовується для обчислення залишку від ділення?",
            a: "3",
            inline_keyboard: (language) => [
                [{ text: "+", callback_data: JSON.stringify({ t: "c", id: "9", a: "1", l: language }) }],
                [{ text: "-", callback_data: JSON.stringify({ t: "c", id: "9", a: "2", l: language }) }],
                [{ text: "%", callback_data: JSON.stringify({ t: "c", id: "9", a: "3", l: language }) }],
                [{ text: "*", callback_data: JSON.stringify({ t: "c", id: "9", a: "4", l: language }) }],
                [{ text: "/", callback_data: JSON.stringify({ t: "c", id: "9", a: "5", l: language }) }]
            ]
        },
        {
            id: "10", 
            q: "Який з наступних підходів використовується для написання функцій, що викликають самі себе?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "Ітерація", callback_data: JSON.stringify({ t: "c", id: "10", a: "1", l: language }) }],
                [{ text: "Рекурсія", callback_data: JSON.stringify({ t: "c", id: "10", a: "2", l: language }) }],
                [{ text: "Поліморфізм", callback_data: JSON.stringify({ t: "c", id: "10", a: "3", l: language }) }],
                [{ text: "Абстракція", callback_data: JSON.stringify({ t: "c", id: "10", a: "4", l: language }) }],
                [{ text: "Інкапсуляція", callback_data: JSON.stringify({ t: "c", id: "10", a: "5", l: language }) }]
            ]
        }
    ]
};
