// spamDetectionService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function fetchUpcomingEvents() {
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
              Ти - асистент в спільноті, що спеціалізується на інформаційних технологіях в Австрії.
              Знайди список майбутніх конференцій, вебінарів та зустрічей в цьому місяці. Сьогодні ${period}.
              Використовуй наступну схему для кожної події:
              dd.mm - місто - назва - опис події

              - Переконайся, що події є актуальними.
              - Додайте 5-10 подій.
              - розділяй події подвійним переносом строки
              
              Приклади відповідей:
               - Доброго раночку друзі, ось список івентів, які плануються на цей місяць
               - Вітаю, спільното. Нагадую, що цього місяця відбудуться такі події та мітапи

              Не дублюй привітання у своїй відповіді.
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  fetchUpcomingEvents
};
