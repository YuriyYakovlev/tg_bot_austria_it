// dialogueDigestService.js
const { VertexAI } = require("@google-cloud/vertexai");
const audioService = require("./audioService");
const moment = require('moment');


let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function generateAudioDialogue(digest, langCode) {
  try {
    const dialogueData = await generateDialogue(digest);
    
    if (!dialogueData || !dialogueData.dialogue) {
      console.log("No dialogue found.");
      return;
    }
    const dialogue  = dialogueData.dialogue;

    let manSentences = [];
    let womanSentences = [];
    
    // Separate Max's and Anna's sentences
    dialogue.forEach((entry, index) => {
      if (entry.speaker === "Yurii") {
        manSentences.push(entry.text);
      } else if (entry.speaker === "Olena") {
        womanSentences.push(entry.text);
      }
    });

    let audio = await audioService.generateDigestDialogueAudioConcatenated(manSentences, womanSentences, langCode);

    //console.log(dialogue);
    //console.log(dialogue.image_prompt);
    
    return {
      audio: audio,
    };
 
  } catch (error) {
    console.error("Error generating dialogue:", error.message);
  }
}

async function generateDialogue(digest) {
  try {
    const date = moment().format("DD MMMM YYYY");
    const request = prepareRequest(digest, date);
    const generativeModel = vertexAI.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 1000,
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

    let dialogueData;
    try {
      dialogueData = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse JSON:', err.message);
      //console.error('Raw response:', textResponse);
      return null;
    }

    if (!Array.isArray(dialogueData.dialogue)) {
      console.error('Invalid dialogue format:', dialogueData);
      return null;
    }

    return { dialogue: dialogueData.dialogue };
  } catch (error) {
    console.error('Error in fetchWordOfTheDay:', error.message);
  }
}

function prepareRequest(digest, date) {
  let digestPrompt = digest ? `They can also add this data: '${digest}'.` : '';
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              Yurii and Olena are DJs at the radio station 'Austria IT Chat'.
              They discuss the latest IT news from Austria and worldwide.
              Today is ${date}.
            
               Mandatory Sections:
                - Greet active Austria IT Chat participants:
                    Egor Levchenko - for his optimism and mood, that motivates others.
                    Alex Grin - for his readiness to help with legal questions.
                    Max - for his active participation in all the ukrainian chats and helpful answers.
                - Mention a premium sponsor of podcasts: 'Videns'ka vodichka'.
                - Discuss the latest IT news from Austria and worldwide (use online sources).
                - End with a wish for the war in Ukraine to end soon.

              Output languange: English.

              To enhance the naturalness of the dialogue use auxiliary words such as:
               "yeah", "hmm", "yeah absolutely", "right", "you know", "ok", "am", "think about it", "aah"
              as a reaction to previous speaker phrase, while he is talking.

              Output should be in JSON: 
              {
                "dialogue": [
                  { "speaker": "Yurii", "text": "Yurii's first sentence" },
                  { "speaker": "Olena", "text": "Olena's first sentence" },
                  { "speaker": "Yurii", "text": "Yurii's second sentence" },
                  { "speaker": "Olena", "text": "Olena's second sentence" }
                ] 
              }

              ${digestPrompt}
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  generateAudioDialogue,
};
