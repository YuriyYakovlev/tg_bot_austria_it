const { VertexAI } = require("@google-cloud/vertexai");
const db = require('../db/connectors/dbConnector');

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function fetchPreviousWords(chatId = null) {
  const query = `SELECT word FROM word_of_the_day_history WHERE chat_id = ? OR chat_id IS NULL`;
  try {
    const [rows] = await db.query(query, [chatId]);
    return rows.map(row => row.word);
  } catch (error) {
    console.error('Error fetching previous words from the database:', error.message);
    return [];
  }
}

async function addWordToHistory(word, description, chatId = null) {
  const query = `INSERT INTO word_of_the_day_history (word, description, chat_id) VALUES (?, ?, ?)`;
  try {
    await db.query(query, [word, description, chatId]);
    //console.log('Word added to history:', word);
  } catch (error) {
    console.error('Error adding word to history:', error.message);
  }
}

async function fetchWordOfTheDay(chatId = null) {
  try {
    const previousWords = await fetchPreviousWords(chatId);

    const request = prepareRequest(previousWords);
    const generativeModel = vertexAI.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 500,
        temperature: 0,
        top_p: 1,
      },
      tools: [
        {
          googleSearch: {},
        },
      ],
    });

    const classificationResponse = await generativeModel.generateContentStream(request);
    let response = (await classificationResponse.response);
    const hasCandidates = response.candidates && response.candidates.length > 0;
    if (!hasCandidates) {
      return;
    }
    let textResponse = response.candidates[0].content.parts[0].text;
    textResponse = textResponse.replaceAll('*', '').replaceAll('```json', '').replaceAll('```', '');

    let wordData;
    try {
      wordData = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse the word data:', err.message);
      return;
    }

    if (wordData && wordData.word && wordData.description) {
      await addWordToHistory(wordData.word, wordData.description, chatId);
      return { word: wordData.word, description: wordData.description };
    } else {
      console.error('Invalid data format:', textResponse);
      return;
    }
  } catch (error) {
    console.error('Error in fetchWordOfTheDay:', error.message);
  }
}

function prepareRequest(previousWords) {
  const excludedWords = previousWords.length > 0 ? previousWords.join(", ") : "none";
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              You are a bot in IT community chat. They are Ukrainians who learn German.
              You should do a "word of the day," ideally on IT thematics.
              Give me a word of the day.

              Preferred output:
              - The word of the day in German
              - Its translation and short meaning in Ukrainian
              
              Output should be in JSON: {“word”, “description”}
              
              Example of output: {“die Datenintegrität” , “Цілісність даних. Це забезпечення точності та повноти даних протягом усього їх життєвого циклу, а також захист їх від несанкціонованих змін.”}
              
              Do not do introductions or summary.
              Use tricky and difficult words. Do not use words, which sound similar in both languages or have English roots.
              Do not use these words: “${excludedWords}”.
              Let's try. Give me the word of the day.
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  fetchWordOfTheDay,
};
