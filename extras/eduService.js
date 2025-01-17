// spamDetectionService.js
const { VertexAI }  = require("@google-cloud/vertexai");

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

const previousWords = [];

async function fetchWordOfTheDay() {
  try {

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
    textResponse = textResponse.replaceAll('```json', '');
    textResponse = textResponse.replaceAll('```', '');
    //console.log(textResponse);

    let wordData;
    try {
      wordData = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse the word data:', err.message);
      return;
    }

    if (wordData && wordData.word && wordData.description) {
      previousWords.push(wordData.word);
      return { word: wordData.word, description: wordData.description };
    } else {
      console.error('Invalid data format:', textResponse);
      return;
    }
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
              You are a bot in IT community chat. They are ukrainians who learn German.
              You should do word of the day, ideally on IT thematics.
              Give me a word of the day.

              Preffered output:
              - the word of the day on German
              - its translation and short meaning on ukrainian
              
              Output should be in json: {“word”, “description”}
              
              Example of output: {“die Datenintegrität” , “Цілісність даних. Це забезпечення точності та повноти даних протягом усього їх життєвого циклу, а також захист їх від несанкціонованих змін.”}
              
              Do not do introductions or summary.
              Use tricky and difficult words. Do not use words, which sounds on both languages similarly or have English roots.
              Do not use these words: “${previousWords.join(", ")}”.
              Let's try. Give me the word of the day.
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  fetchWordOfTheDay
};
