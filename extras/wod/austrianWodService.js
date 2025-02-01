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
    
    const message = `<u>Сленг дня</u>: <b>${wordOfTheDay.word}</b>\n(${wordOfTheDay.ukrainian})\n<i>${wordOfTheDay.description_ua}</i>`;
    let dialogue = await dialogueService.generateAudioDialogue(wordOfTheDay.word, true, "de-DE");    
    const image = await imageService.generateImage(dialogue.image_prompt);

    if (image) {
      let germanAudio = await audioService.generateGermanAudioConcatenated(wordOfTheDay.word,  wordOfTheDay.description_de, "de-DE");
      let germanVoice = await audioService.mergeAudioStreams([germanAudio, dialogue.audio]);

      const audioFilePath = await audioService.saveAudioStreamToFile(germanVoice);
      //let srt = await audioService.generateSRTCaptions(audioFilePath, 'de-DE');
      //console.log("srt: ", srt);
      const videoBuffer = await videoService.generateVideoAsBuffer(image, audioFilePath, wordOfTheDay.word);

      await bot.sendVideo(chatId, videoBuffer, {
        caption: message,
        parse_mode: "HTML",
        message_thread_id: threadId,
      });
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
    console.error("Error posting slang of the day:", error.message);
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

    if (wordData && wordData.word && wordData.description_ua) {
      await utils.addWordToHistory(wordData.word, wordData.description_ua, chatId);
      return { word: wordData.word, ukrainian: wordData.ukrainian, description_ua: wordData.description_ua, description_de: wordData.description_de };
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
              You are an assistant in Austrian chat group.
              You should suggest the "Slang of the day" for the community of Ukrainians, who learn German and local culture.

              Output should be in JSON: 
              {
                "word": “The slang of the day on Austrian or Austrian dialect.”, 
                "ukrainian": "Translation to Ukrainian, one word, without explanation.",
                "description_ua": “Short description on Ukrainian. One sentence.”, 
                "description_de": "The same description on German"
              }
       
              Let's try. Give me the slang of the day.

              Do not use these words: “${excludedWords}”.
              Let's try. Give me the Slang of the day.
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
