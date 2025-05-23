// eduService.js
const { VertexAI } = require("@google-cloud/vertexai");

const utils = require("./utils");
const audioService = require("../media/audio/audioService");
const dialogueService = require("../media/audio/dialogueService");
const imageService = require("../media/imageService");
const videoService = require("../media/videoService");

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function postWordOfTheDay(bot) {
  try {
    const wordOfTheDay = await fetchWordOfTheDay();
    if (!wordOfTheDay) {
      console.log("No word of the day found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.EDU_THREAD_ID; 
    
    const message = `<u>Слово дня</u>: <b>${wordOfTheDay.word}</b>\n(${wordOfTheDay.english} / ${wordOfTheDay.ukrainian})\n<i>${wordOfTheDay.description_ua}</i>\n\n${wordOfTheDay.sample_phrase}`;
    let dialogue = await dialogueService.generateAudioDialogue(wordOfTheDay.word, false, "de-DE");    
    const image = await imageService.generateImage(dialogue.image_prompt);
    
    if (image) {
      let germanAudio = await audioService.generateGermanAudioConcatenated(wordOfTheDay.word, wordOfTheDay.description_de, "de-DE");
      let germanVoice = await audioService.mergeAudioStreams([germanAudio, dialogue.audio]);

      const audioFilePath = await audioService.saveAudioStreamToFile(germanVoice);
      //let srt = await audioService.generateSRTCaptions(audioFilePath, 'de-DE');
      //console.log("srt: ", srt);
      const clickToListen = "\n(натисніть, щоб прослухати)";
      const videoBuffer = await videoService.generateVideoAsBuffer(image, audioFilePath, wordOfTheDay.word + clickToListen);

      await bot.sendVideo(chatId, videoBuffer, {
        caption: message,
        parse_mode: "HTML",
        message_thread_id: threadId,
      });
      // await bot.sendPhoto(chatId, image, {
      //   caption: message,
      //   parse_mode: "HTML",
      //   message_thread_id: threadId,
      // });

      // await bot.sendVoice(chatId, voice, {
      //   message_thread_id: threadId,
      //   caption: wordOfTheDay.word,
      //   arse_mode: "HTML"
      // });
    } else {
        let wodAudio = await audioService.generateGermanAudioConcatenated(
          wordOfTheDay.word, wordOfTheDay.description_de, "de-DE");
        let voice = await audioService.mergeAudioStreams([wodAudio, dialogue.audio]);

        await bot.sendVoice(chatId, voice, {
            message_thread_id: threadId,
            caption: message,
            parse_mode: "HTML"
        });
    }
 
  } catch (error) {
    console.error("Error posting word of the day:", error.message);
  }
}

async function fetchWordOfTheDay(chatId = null) {
  try {
    const previousWords = await utils.fetchPreviousWords(chatId);

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

    if (wordData && wordData.word) {
      await utils.addWordToHistory(wordData.word, chatId);
      return { 
        word: wordData.word, english: wordData.english, ukrainian: wordData.ukrainian, description_ua: wordData.description_ua,
        description_de: wordData.description_de, sample_phrase: wordData.sample_phrase };
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
                "description_de": "the same description on German",
                "sample_phrase": "Sample phrase with this word on German."
              }
              
              Example of output: 
              {
                "word": “die Datenintegrität” , 
                "english": “Data Integrity”, 
                "ukrainian": “Цілісність даних", 
                "description_ua": "Забезпечення точності та повноти даних протягом усього їх життєвого циклу.”, 
                "description_de": "Sicherstellung der Richtigkeit und Vollständigkeit der Daten während ihres gesamten Lebenszyklus.",
                "sample_phrase": "Die Datenintegrität muss jederzeit gewährleistet sein, um die Sicherheit und Verlässlichkeit der Informationen zu garantieren."
              }
              
              Use tricky and commonly used words. Do not use words, which sound similar in both languages or have English roots.
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
