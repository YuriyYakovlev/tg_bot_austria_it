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
                [{ text: "0", callback_data: JSON.stringify({ t: "c", id: "1", a: "2", l: language}) }],
                [{ text: "-1", callback_data: JSON.stringify({ t: "c", id: "1", a: "3", l: language }) }]
            ]
        },
        {
            id: "2", 
            q: "Яка швидкість світла у вакуумі?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "150,000 км/с", callback_data: JSON.stringify({ t: "c", id: "2", a: "1", l: language }) }],
                [{ text: "299,792,458 м/с", callback_data: JSON.stringify({ t: "c", id: "2", a: "2", l: language}) }],
                [{ text: "300,000 км/с", callback_data: JSON.stringify({ t: "c", id: "2", a: "3", l: language }) }]
            ]
        },
        {
            id: "3", 
            q: "Яка планета є найбільшою у Сонячній системі?",
            a: "4",
            inline_keyboard: (language) => [
                [{ text: "Земля", callback_data: JSON.stringify({ t: "c", id: "3", a: "1", l: language }) }],
                [{ text: "Венера", callback_data: JSON.stringify({ t: "c", id: "3", a: "2", l: language }) }],
                [{ text: "Марс", callback_data: JSON.stringify({ t: "c", id: "3", a: "3", l: language }) }],
                [{ text: "Юпітер", callback_data: JSON.stringify({ t: "c", id: "3", a: "4", l: language }) }],
                [{ text: "Сатурн", callback_data: JSON.stringify({ t: "c", id: "3", a: "5", l: language }) }]
            ]
        },
        {
            id: "4", 
            q: "Хто написав роман 'Війна і мир'?",
            a: "2",
            inline_keyboard: (language) => [
                [{ text: "Федір Достоєвський", callback_data: JSON.stringify({ t: "c", id: "4", a: "1", l: language }) }],
                [{ text: "Лев Толстой", callback_data: JSON.stringify({ t: "c", id: "4", a: "2", l: language }) }],
                [{ text: "Олександр Пушкін", callback_data: JSON.stringify({ t: "c", id: "4", a: "3", l: language }) }],
                [{ text: "Антон Чехов", callback_data: JSON.stringify({ t: "c", id: "4", a: "4", l: language }) }],
                [{ text: "Іван Тургенєв", callback_data: JSON.stringify({ t: "c", id: "4", a: "5", l: language }) }]
            ]
        },
        {
            id: "5", 
            q: "Скільки значень може мати boolean тип?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "0", callback_data: JSON.stringify({ t: "c", id: "5", a: "0", l: language }) }],
                [{ text: "1", callback_data: JSON.stringify({ t: "c", id: "5", a: "1", l: language}) }],
                [{ text: "2", callback_data: JSON.stringify({ t: "c", id: "5", a: "2", l: language }) }]
            ]
        },
        {
            id: "6", 
            q: "До якого міста найближче розташований вулкан Ейяф'яльлайокудль?", 
            a: "0", 
            inline_keyboard: (language) => [
                [{ text: "Рейк'явік", callback_data: JSON.stringify({ t: "c", id: "6", a: "0", l: language }) }],
                [{ text: "Копавогур", callback_data: JSON.stringify({ t: "c", id: "6", a: "1", l: language}) }],
                [{ text: "Фьярроабіго", callback_data: JSON.stringify({ t: "c", id: "6", a: "2", l: language }) }]
            ]
        },
        {
            id: "7", 
            q: "Скільки градусів у сумі внутрішніх кутів трикутника?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "90", callback_data: JSON.stringify({ t: "c", id: "7", a: "1", l: language }) }],
                [{ text: "180", callback_data: JSON.stringify({ t: "c", id: "7", a: "2", l: language}) }],
                [{ text: "360", callback_data: JSON.stringify({ t: "c", id: "7", a: "3", l: language }) }]
            ]
        },
        {
            id: "8", 
            q: "Яка перша літера англійського алфавіту?", 
            a: "3", 
            inline_keyboard: (language) => [
                [{ text: "A. C", callback_data: JSON.stringify({ t: "c", id: "8", a: "1", l: language }) }],
                [{ text: "B. D", callback_data: JSON.stringify({ t: "c", id: "8", a: "2", l: language}) }],
                [{ text: "C. A", callback_data: JSON.stringify({ t: "c", id: "8", a: "3", l: language }) }]
            ]
        },
        {
            id: "9", 
            q: "Який хімічний елемент має символ 'O'?",
            a: "1",
            inline_keyboard: (language) => [
                [{ text: "Кисень", callback_data: JSON.stringify({ t: "c", id: "9", a: "1", l: language }) }],
                [{ text: "Водень", callback_data: JSON.stringify({ t: "c", id: "9", a: "2", l: language }) }],
                [{ text: "Натрій", callback_data: JSON.stringify({ t: "c", id: "9", a: "3", l: language }) }],
                [{ text: "Залізо", callback_data: JSON.stringify({ t: "c", id: "9", a: "4", l: language }) }],
                [{ text: "Уран", callback_data: JSON.stringify({ t: "c", id: "9", a: "5", l: language }) }]
            ]
        },
        {
            id: "10", 
            q: "Яка одиниця, у рівні приблизно 746 ват, використовується для вимірювання швидкості виконання роботи?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "Віслюча сила", callback_data: JSON.stringify({ t: "c", id: "10", a: "1", l: language }) }],
                [{ text: "Кінська сила", callback_data: JSON.stringify({ t: "c", id: "10", a: "2", l: language}) }],
                [{ text: "Сила зебри", callback_data: JSON.stringify({ t: "c", id: "10", a: "3", l: language }) }]
            ]
        }
    ]
};
