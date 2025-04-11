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
            q: "Якого кольору банан, коли він стиглий?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "Зелений", callback_data: JSON.stringify({ t: "c", id: "1", a: "1", l: language }) }],
                [{ text: "Жовтий", callback_data: JSON.stringify({ t: "c", id: "1", a: "2", l: language}) }],
                [{ text: "Синій", callback_data: JSON.stringify({ t: "c", id: "1", a: "3", l: language }) }]
            ]
        },
        {
            id: "2", 
            q: "Скільки ніг у кішки?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "2", callback_data: JSON.stringify({ t: "c", id: "2", a: "1", l: language }) }],
                [{ text: "4", callback_data: JSON.stringify({ t: "c", id: "2", a: "2", l: language}) }],
                [{ text: "6", callback_data: JSON.stringify({ t: "c", id: "2", a: "3", l: language }) }]
            ]
        },
        {
            id: "3", 
            q: "Що зазвичай одягають на ноги?",
            a: "4",
            inline_keyboard: (language) => [
                [{ text: "Паляницю", callback_data: JSON.stringify({ t: "c", id: "3", a: "1", l: language }) }],
                [{ text: "Капелюх", callback_data: JSON.stringify({ t: "c", id: "3", a: "2", l: language }) }],
                [{ text: "Рукавички", callback_data: JSON.stringify({ t: "c", id: "3", a: "3", l: language }) }],
                [{ text: "Шкарпетки", callback_data: JSON.stringify({ t: "c", id: "3", a: "4", l: language }) }],
                [{ text: "Краватку", callback_data: JSON.stringify({ t: "c", id: "3", a: "5", l: language }) }]
            ]
        },
        {
            id: "4", 
            q: "Що з цього — частина українського народного одягу?",
            a: "2",
            inline_keyboard: (language) => [
                [{ text: "фуфайка", callback_data: JSON.stringify({ t: "c", id: "4", a: "1", l: language }) }],
                [{ text: "вишиванка", callback_data: JSON.stringify({ t: "c", id: "4", a: "2", l: language }) }],
                [{ text: "косоворотка", callback_data: JSON.stringify({ t: "c", id: "4", a: "3", l: language }) }]
            ]
        },
        {
            id: "5", 
            q: "Як українською буде 'подъезд'?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "вход", callback_data: JSON.stringify({ t: "c", id: "5", a: "0", l: language }) }],
                [{ text: "парадне", callback_data: JSON.stringify({ t: "c", id: "5", a: "1", l: language}) }],
                [{ text: "під’їзд", callback_data: JSON.stringify({ t: "c", id: "5", a: "2", l: language }) }]
            ]
        },
        {
            id: "6", 
            q: "Що з цього — назва української страви?", 
            a: "0", 
            inline_keyboard: (language) => [
                [{ text: "вареники", callback_data: JSON.stringify({ t: "c", id: "6", a: "0", l: language }) }],
                [{ text: "манти", callback_data: JSON.stringify({ t: "c", id: "6", a: "1", l: language}) }],
                [{ text: "хінкалі", callback_data: JSON.stringify({ t: "c", id: "6", a: "2", l: language }) }]
            ]
        },
        {
            id: "7", 
            q: "Як українці кажуть на «бутерброд»?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "бутерброд", callback_data: JSON.stringify({ t: "c", id: "7", a: "1", l: language }) }],
                [{ text: "канапка", callback_data: JSON.stringify({ t: "c", id: "7", a: "2", l: language}) }],
                [{ text: "сэндвич", callback_data: JSON.stringify({ t: "c", id: "7", a: "3", l: language }) }]
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
            q: "Яке з цих слів українське, а не суржик чи російське?",
            a: "1",
            inline_keyboard: (language) => [
                [{ text: "гарбуз", callback_data: JSON.stringify({ t: "c", id: "9", a: "1", l: language }) }],
                [{ text: "тыква", callback_data: JSON.stringify({ t: "c", id: "9", a: "2", l: language }) }],
                [{ text: "кабак", callback_data: JSON.stringify({ t: "c", id: "9", a: "3", l: language }) }]
            ]
        },
        {
            id: "10", 
            q: "Яке з цих слів — українське означення для «сумка»?", 
            a: "2", 
            inline_keyboard: (language) => [
                [{ text: "сумка", callback_data: JSON.stringify({ t: "c", id: "10", a: "1", l: language }) }],
                [{ text: "торба", callback_data: JSON.stringify({ t: "c", id: "10", a: "2", l: language}) }],
                [{ text: "авоська", callback_data: JSON.stringify({ t: "c", id: "10", a: "3", l: language }) }]
            ]
        }
    ]
};
