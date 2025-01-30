// eduService.js
const { VertexAI } = require("@google-cloud/vertexai");
const db = require('../../db/connectors/dbConnector');
const audioGenService = require("../audioGenService");
const dialogueService = require("./dialogueService");

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

async function postWordOfTheDay(bot) {
  try {
    const wordOfTheDay = await fetchWordOfTheDay();
    if (!wordOfTheDay) {
      console.log("No word of the day found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.EDU_THREAD_ID; 
    
    const message = `<u>Слово дня</u>: <b>${wordOfTheDay.word}</b>\n(${wordOfTheDay.english} / ${wordOfTheDay.ukrainian})\n\n<i>${wordOfTheDay.description_ua}</i>`;

    let audio = await audioGenService.generateMultilingualAudioConcatenated(
      wordOfTheDay.word,
      wordOfTheDay.ukrainian,
      wordOfTheDay.description_ua, 
      wordOfTheDay.description_de
    );
    
    let dialogue = await dialogueService.generateAudioDialogue(wordOfTheDay.word);    
    let voice= await audioGenService.mergeAudioStreams([audio, dialogue]);

    await bot.sendVoice(chatId, voice, {
      message_thread_id: threadId,
      caption: message,
      parse_mode: "HTML"
    });
 
  } catch (error) {
    console.error("Error posting word of the day:", error.message);
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

    if (wordData && wordData.word && wordData.description_ua) {
      await addWordToHistory(wordData.word, wordData.description_ua, chatId);
      return { word: wordData.word, english: wordData.english, ukrainian: wordData.ukrainian, description_ua: wordData.description_ua, description_de: wordData.description_de };
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
              You are an assistant specializing in information technology in Austria.
              You should suggest the "word of the day" for the IT community of Ukrainians, who learn German.

              Output should be in JSON: 
              {
                "word": “the word of the day on German”, 
                "english": "translation to English ", 
                "ukrainian": "translation to Ukrainian",
                "description_ua": “short description on Ukrainian. One sentence.”, 
                "description_de": "the same description on German"
              }
              
              Example of output: 
              {
                "word": “die Datenintegrität” , 
                "english": “Data Integrity”, 
                "ukrainian": “Цілісність даних", 
                "description_ua": "Забезпечення точності та повноти даних протягом усього їх життєвого циклу.”, 
                "description_de": "Sicherstellung der Richtigkeit und Vollständigkeit der Daten während ihres gesamten Lebenszyklus."
              }
              
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
  postWordOfTheDay,
};
