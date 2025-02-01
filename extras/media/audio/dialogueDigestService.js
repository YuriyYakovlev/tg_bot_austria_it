// dialogueDigestService.js
const { VertexAI } = require("@google-cloud/vertexai");
const audioService = require("./audioService");
const moment = require('moment');


let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function generateAudioDialogue(digest) {
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
      if (entry.speaker === "Alex") {
        manSentences.push(entry.text);
      } else if (entry.speaker === "Olena") {
        womanSentences.push(entry.text);
      }
    });

    let audio = await audioService.generateDigestDialogueAudioConcatenated(manSentences, womanSentences);

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

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              Alex and Olena are DJs at the radio, called 'Austria IT Chat'.
              They have to talk through the weekly news digest for Ukrainian community about Austrian IT sector.
              To enrich their discussion, they should also find and discuss the latest IT news from Austria and global IT trends, which you will find in Internet. Today is ${date}.
              
              After news section say hello to active Austria IT Chat participants, particularly to:
                Egor Levchenko - for his optimism and mood, that motivates others.
                Alex Grin - for his readiness to help with legal questions.
                Max - for his active participation in all the ukrainian chats and helpful answers.

              Mention a premium sponsor of podcasts: 'Videns'ka vodichka'.
              
              Finish a conversation by wishing the sooon end of the war in Ukraine and the glory to Ukraine.
              Output languange: English.
              Convert this weekly news digest to the script for them:

              Output should be in JSON: 
              {
                "dialogue": [
                  { "speaker": "Alex", "text": "Alex's first sentence" },
                  { "speaker": "Olena", "text": "Olena's first sentence" },
                  { "speaker": "Alex", "text": "Alex's second sentence" },
                  { "speaker": "Olena", "text": "Olena's second sentence" }
                ] 
              }

              Now, generate a dialogue using this digest: '${digest}'.
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
