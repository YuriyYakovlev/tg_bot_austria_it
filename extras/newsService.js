// spamDetectionService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function fetchNewsDigest() {
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
              Ти - асистент в спільноті, що спеціалізується на інформаційних технологіях в Австрії.
              Зроби підсумок новин у сфері розробки програмного забезпечення в Австрії за попередній тиждень. Сьогодні ${period}. 
              Розбий новини на групи:
                <b>Аналітика</b> 
                [тут ти опишеш про нові вакансії та тренди на ринку праці в ІТ з Австрії, вкажи стистику по затребуваним технологіям, не пиши про зарплати]
                <b>Стартапи</b> [тут ти опишеш про нові стартапи з Австрії, які зʼявились в новинах минулого тижня]
                <b>Новини</b> [тут ти опишеш про новини з австрійського ІТ за минулий тиждень]

              Переконайся, що новини є актуальними.
              Додай 5 найважливіших новин та подій до кожної групи .
              Розділяй новини в групах подвійним переносом строки
              Якщо немає значних подій для групи за минулий тиждень, то пропусти цю групу.

              Використовуй наступну схему для кожної новини:
              • новина - стислий опис
                            
              Приклад відповідей:
                - Доброго раночку друзі, ось що відбувалось в австрійському ІТ минулого тижня.
                - Вітаю, спільното. Минулого тижня були такі події в австрійському ІТ.
                - Всім салют. Цього разу в нашій підбірці дайджест новин за минулий тиждень.

              Не дублюй привітання у своїй відповіді.
              Використовуй емодзі.
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  fetchNewsDigest
};
