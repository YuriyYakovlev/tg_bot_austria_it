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
    const dialogueData = await generateDialogue(digest, langCode);
    
    if (!dialogueData || !dialogueData.dialogue) {
      console.log("No dialogue found.");
      return;
    }
    const dialogue  = dialogueData.dialogue;

    let manSentences = [];
    let womanSentences = [];
    
    // Separate Max's and Anna's sentences
    dialogue.forEach((entry, index) => {
      if (entry.speaker === "Yuriy") {
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
      title: dialogueData.title
    };
 
  } catch (error) {
    console.error("Error generating dialogue:", error);
  }
}

async function generateDialogue(digest, langCode) {
  try {
    const date = moment().format("DD MMMM YYYY");
    const request = prepareRequest(digest, date, langCode);
    const generativeModel = vertexAI.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 2000,
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

    return { dialogue: dialogueData.dialogue, title: dialogueData.title };
  } catch (error) {
    console.error('Error in fetchWordOfTheDay:', error.message);
  }
}

function prepareRequest(digest, date, langCode) {
  let digestPrompt = digest ? `They can also add to their talk these, when defined: '${digest}'.` : '';
  let language = langCode === 'uk-UA' ? 'Ukrainian' : 'English';
  let auxWords = langCode === 'uk-UA' ? '"ага", "так", "угу", "хм", "гаразд", "окей", "добре"' 
                                      : '"yeah", "hmm", "ok", "am", "aah"';

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              Yuriy and Olena are DJs at the radio station 'Austria IT Chat'.
              They discuss the latest IT news from Austria and worldwide.
              Today is ${date}.
            
               **Mandatory Requirements:**
                * Start with a short greeting — something futuristic, and hacker-esque, as if broadcasting from a dystopian underground network.
                * Greet chat newcomers, who are actively looking for a job.
                  Remind them that our chat member Tania Austrannik developed a career coach in ChatGPT, that can help them with first steps in Austria Job Market.
                * Greet those chat members, who are starting the self-enterpreneurship in Austria.
                  Remind them that our chat member Tamara Klimenko can suggest them proven Tax Advisors.
                * Thank Yevheniy Yevtushenko for his tips in prompt engeneering.

                * Discuss the latest IT news from Austria and worldwide (use online sources).
                * End with a wish for the war in Ukraine to end soon in a cyberpunk-style, tech-infused, as if signing off from a pirate transmission.

              Output languange: ${language}.

              To enhance the naturalness of the dialogue use auxiliary words such as: ${auxWords}.

              **Output should be in JSON:**
              {
                "title": "<A short, catchy title relevant to the IT news. Language: ${language}>",  
                "dialogue": [
                  { "speaker": "Yuriy", "text": "Yuriy's first sentence" },
                  { "speaker": "Olena", "text": "Olena's first sentence" },
                  { "speaker": "Yuriy", "text": "Yuriy's second sentence" },
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
