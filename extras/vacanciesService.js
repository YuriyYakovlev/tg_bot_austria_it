// spamDetectionService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function fetchNewVacancies() {
  try {

    const currentMonthYear = moment().format("DD MMMM YYYY");
    const request = prepareRequest(currentMonthYear);
    const generativeModel = vertexAI.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 1000,
        temperature: 0,
        top_p: 1,
      },
      tools: [
      {
        googleSearch: {}
      }
    ]
    });

    const classificationResponse = await generativeModel.generateContentStream(request);
    
    let response = (await classificationResponse.response);
    const hasCandidates = response.candidates && response.candidates.length > 0;
    if (!hasCandidates) {
        return;
    }
    let textResponse = response.candidates[0].content.parts[0].text;

    textResponse = textResponse.replaceAll('*', '');
    textResponse = textResponse.replaceAll('<br>', '');
    //console.log(textResponse);
    return textResponse;
  } catch (error) {
    console.error('Error in classifyMessages:', error.message);
  }
}

function prepareRequest(period) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              ### Інструкції ###
              Ти - рекрутмент асистент в спільноті, що спеціалізується на інформаційних технологіях в Австрії.
              Зроби підсумок нових вакансій для Австрії за попередній тиждень. Сьогодні ${period}.

              Використовуй наступну схему для кожної вакансії:
              компанія - короткий опис вакансії, включаючи знання німецької мови, рівень позиції, формат роботи, ключові вимоги (якщо є)

              Важливо:
              1. Переконайся, що кожна вакансія містить конкретну назву компанії. Вакансії без назви компанії не включай до списку.
              2. Якщо можливо, додавай інформацію про рівень позиції, формат роботи (дистанційна, офіс, гібрид), основні вимоги чи мову спілкування.
              3. Не включай посади, якщо інформації недостатньо для складання зрозумілого оголошення.

              Додай по 5 найцікавіших вакансій для кожної технології.
              Виділяй технології як strong HTML розміткою.

              Не дублюй привітання у своїй відповіді.
              Не закінчуй підсумок сумаризацієй або розʼясненнями.

              Приклад оформлення:
              -----
                Доброго ранку, спільното! Ось огляд цікавих вакансій за попередній тиждень 🇦🇹.

                --- Java ---
                <ins>Bitmovin</ins> - Senior Software Engineer Java (LIVE Encoding)
                Проект: Інструменти для потокового відео
                Вимоги: Java 11+, Spring, Kubernetes

                <ins>Accenture</ins> - Junior Consultant Technology Strategy & Advisory (all genders)
                Проект: Консалтинг в сфері IT-стратегії
                Формат роботи: Гібридна (Відень)
                Зарплата: в євро якщо вказана

                --- Python ---
                <ins>Dynatrace</ins> - Cloud Engineer Python
                Вимоги: Python, AWS, CI/CD

                Джерела:
                  devjobs.at, englishjobsearch.at, karriere.at, metajob.at, startup.jobs, eurotechjobs.com, academicpositions.com.

                🔍 Зверніть увагу: Вакансії зібрані з відкритих джерел. Для деталей або подання заявки знайдіть інформацію в Інтернеті та зверніться до компанії напряму.
                
                Бажаю всім продуктивного тижня!
              -----
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  fetchNewVacancies
};
