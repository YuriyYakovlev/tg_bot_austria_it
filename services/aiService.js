// aiService.js
const vertexAi = require("@google-cloud/vertexai");
const db = require("../db/connectors/dbConnector");

let vertexAiClient = new vertexAi.VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function classifyMessages() {
  try {
    console.log(`Classification Job started`);
    const [messages] = await db.query('SELECT messageId, messageText FROM cached_messages WHERE is_spam IS FALSE');
    if (messages.length === 0) {
      console.log('No messages to classify.');
      return;
    }
    const formattedMessages = messages.map(msg => `{"message_id":"${msg.messageId}", "text":${JSON.stringify(msg.messageText)}}`);
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
    let count = 0;
    for (const result of parsedResult) {
      if (result && result.is_spam === 'true') {
        await db.query('UPDATE cached_messages SET is_spam = ? WHERE messageId = ?', [true, result.message_id]);
        count++;
      }
    }
    console.log(`Classification Job finished. ${count} new spam message(s) detected.`);
  } catch (error) {
    console.error('Error in classifyMessages:', error);
  }
}

async function isSpamMessage(text) {
  try {
    const request = prepareClassificationRequest(`{"message_id":"temp_id", "text":${JSON.stringify(text)}}`);
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
    return parsedResult.some(result => result.message_id === 'temp_id' && result.is_spam === 'true');
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

              ### Task ###
              Analyse the messages below and return a response exactly in this format:
              { "message_id": "id", "is_spam": "true/false"}

              ### Messages ###
              [${messages}]                
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  classifyMessages,
  isSpamMessage,
};
