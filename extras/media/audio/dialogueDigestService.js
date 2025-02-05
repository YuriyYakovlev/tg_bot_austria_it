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
      if (entry.speaker === "Zero") {
        manSentences.push(entry.text);
      } else if (entry.speaker === "Nano") {
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
              Zero and Nano are DJs at the radio station 'Austria IT Chat'.
              They discuss the latest IT news from Austria and worldwide.
              Today is ${date}.
            
               Mandatory Sections:
                - Start with a cyberpunk-style greeting—something gritty, futuristic, and hacker-esque, as if broadcasting from a dystopian underground network.
                - Greet active Austria IT Chat participants:
                    Tamara Klimenko - for her readiness to help with tax and legal questions.
                    Taras Tomysh - for boosting our chat with new vacancies.
                    newcomers who recently joined and are looking for a job - be optimistic.
                - Mention a premium sponsor of podcasts: 'Videns'ka vodichka'.
                - Discuss the latest IT news from Austria and worldwide (use online sources).
                - End with a wish for the war in Ukraine to end soon in a cyberpunk-style sign-off—mysterious, rebellious, and tech-infused, as if signing off from a pirate transmission.

              Output languange: English.

              To enhance the naturalness of the dialogue use auxiliary words such as:
               "yeah", "hmm", "yeah absolutely", "right", "you know", "ok", "am", "think about it", "aah"
              as a reaction to previous speaker phrase, while he is talking.

              Output should be in JSON: 
              {
                "dialogue": [
                  { "speaker": "Zero", "text": "Zero's first sentence" },
                  { "speaker": "Nano", "text": "Nano's first sentence" },
                  { "speaker": "Zero", "text": "Zero's second sentence" },
                  { "speaker": "Nano", "text": "Nano's second sentence" }
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
