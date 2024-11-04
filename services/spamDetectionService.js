// spamDetectionService.js
const vertexAi = require("@google-cloud/vertexai");
const db = require("../db/connectors/dbConnector");

let vertexAiClient = new vertexAi.VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function classifyMessages() {
  try {
    //console.log(`Classification Job started`);
    const [messages] = await db.query('SELECT messageId, msg_text FROM cached_messages WHERE spam IS FALSE');
    if (messages.length === 0) {
      //console.log('No messages to classify.');
      return;
    }
    const formattedMessages = messages.map(msg => `{"message_id":"${msg.messageId}", "text":${JSON.stringify(msg.msg_text.substring(0, 300))}}`);
    const request = prepareClassificationRequest(formattedMessages.join(", "));

    const generativeModel = vertexAiClient.preview.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 1000,
        temperature: 0,
        top_p: 1,
      },
    });

    const classificationResponse = await generativeModel.generateContentStream(request);
    let textResponse = (await classificationResponse.response).candidates[0]
      .content.parts[0].text;
    const regex = /(\[.*\]|\{.*\})/;
    const jsonMatch = textResponse.match(regex);
    let parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    parsedResult = parsedResult instanceof Array ? parsedResult : [parsedResult];
    //let count = 0;
    for (const result of parsedResult) {
      if (result && result.spam === 'true') {
        await db.query('UPDATE cached_messages SET spam = ? WHERE messageId = ?', [true, result.message_id]);
        //count++;
      }
    }
    //console.log(`Classification Job finished. ${count} new spam message(s) detected.`);
  } catch (error) {
    console.error('Error in classifyMessages:', error.message);
  }
}

async function isOffensiveOrSpamMessage(text) {
  try {
    const request = prepareSingleClassificationRequest(text.substring(0, 300));
    const generativeModel = vertexAiClient.preview.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 1000,
        temperature: 0,
        top_p: 1,
      },
    });

    const classificationResponse = await generativeModel.generateContentStream(request);
    let response = await classificationResponse.response;

    const finishReason = response.candidates[0].finishReason;
    if (finishReason === "SAFETY") {
      console.log("Message is dangerous due to safety filters being triggered.");
      return true;
    }

    let textResponse = response.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/\n/g, ' ').trim();
    
    const regex = /(\[.*\]|\{.*\})/;
    const jsonMatch = textResponse.match(regex);
    let parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    parsedResult = parsedResult instanceof Array ? parsedResult : [parsedResult];
    return parsedResult.some(result => result.issue === 'true');
  } catch (error) {
    console.error('Error in isSpamMessage:', error);
    return false;
  }
}

function prepareClassificationRequest(messages) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              ### Instructions ### 
              You are a chat guard. Your task is to filter messages and identify spam.
              Spam messages usually contain Excessive Praise, Vague Reference, Call to Action, Generic Signature.
              In most cases these are links to earn money, to invest, to do illegal work, to buy illegal products, etc.

              ### Examples of spam ###
              1. Пропоную спробувати нове в цікавій сфері, за подробицями до мене
              2. Привет, coтpyднuчecтвo oнлaйн. Дoxoд oт 1000$ в неделю.Дocтaтoчнo бyдeт тeлeфoнa.
              3. Допоможу поліпшити фінансовий стан
              4. Виїзд за кордон для чоловіків
              5. Цікавить легкий заробіток - пиши?
              6. Пропозиція саме для тебе з гарним доходом
              7. ВАКАНСИЯ —Предлагаем вам легальную занятость
              8. Ищем девушку для фотосессии
              9. Click on the link to provide your answers. Grab this opportunity now
              10. Зарабатывай от десяти тысяч руб.  в сутки. УДАЛЕННАЯ ЗАНЯТОСТЬ . От 18 лет.
              11. Срочно требуются 2 человека. Оплата от 16 тыс. рублей в день.
              12. Кoмy интepеcнo coтpyдничecтвo в перспективной команде. От 500$ в неделю,2-3 часа в день. Пиши в ЛC.
              13. Відкрита вакансія чат менеджер в сфері криптовалюти
              14. РАБОТА В США по H1B!!! Работа на Аляске, З\П от 6000$
              15. Wow, ich bin wirklich begeistert von dieser großartigen Gelegenheit, in Forex und Kryptowährungen zu investieren
              16. Допоможемо виїхати за кордон. Якщо є бажаючі, пишіть в особисті, місця обмежені. 
              17. Ищу людей для сотрудничества.Приятный заработок от 200 $ в день.
              18. Безкоштовні вступні заняття з німецької мови!
              19. CPOЧHO❗️ Пaссивный зaρaбoтoκ. Удaленнαя cфeρa.
              20. Раді повідомити про нове велике надходження товарів у нашому магазині!

              ### Task ###
              Analyse the messages below and return a response exactly in this format:
              { "message_id": "id", "spam": "true/false"}
              Return json only, not reasoning or justification.

              ### Messages ###
              [${messages}]                
            `,
          },
        ],
      },
    ],
  };
}

function prepareSingleClassificationRequest(message) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              Instructions:
              You are a chat guard. Your task is to filter messages and identify inappropriate messages: selling services, scams, rude behavior.
              Analyse the message below and return a response exactly in this format (return json only, not reasoning or justification): {"issue": "true/false"}

              Message to analyse: "${message}" `
          },
        ],
      },
    ],
  };
}

module.exports = {
  classifyMessages,
  isOffensiveOrSpamMessage,
};
