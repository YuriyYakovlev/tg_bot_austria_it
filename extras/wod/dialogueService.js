// eduService.js
const { VertexAI } = require("@google-cloud/vertexai");
const audioGenService = require("../audioGenService");

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function generateAudioDialogue(word, isSlang = false) {
  try {
    const dialogue = await generateDialogue(word, isSlang);
    if (!dialogue) {
      console.log("No dialogue found.");
      return;
    }
    //console.log('dialogue', dialogue);
    const max_sentence1 = dialogue.dialogue[0].text
    const max_sentence2 = dialogue.dialogue[2].text
    const anna_sentence1 = dialogue.dialogue[1].text
    const anna_sentence2 = dialogue.dialogue[3].text

    
    let audio = await audioGenService.generateDialogueAudioConcatenated(
      max_sentence1, max_sentence2, anna_sentence1, anna_sentence2
    );
    
    return audio;
 
  } catch (error) {
    console.error("Error generating dialogue:", error.message);
  }
}

async function generateDialogue(word, isSlang) {
  try {
    
    const request = prepareRequest(word, isSlang);
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

    if (!Array.isArray(dialogueData) || !dialogueData.every(entry => entry.speaker && entry.text)) {
      console.error('Invalid dialogue format:', dialogueData);
      return null;
    }

    return { dialogue: dialogueData };
  } catch (error) {
    console.error('Error in fetchWordOfTheDay:', error.message);
  }
}

function prepareRequest(word, isSlang) {
  const slangNotice = isSlang 
  ? `The word '${word}' is Austrian slang, so the dialogue should reflect this.`
  : '';

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              You are a German teacher.  
              Your task is to generate a short, natural-sounding dialogue around a given word.  
              Dialogue requirements:  
                - Use two speakers: Max and Anna.  
                - Each speaker should have two lines, making a total of four exchanges.  
                - The dialogue should be in German.  
                - Include real-life auxiliary words (e.g., "naja", "also").  
              ${slangNotice} 

              Output should be in JSON: 
              [
                { "speaker": "Max", "text": "Max's first sentence" },
                { "speaker": "Anna", "text": "Anna's first sentence" },
                { "speaker": "Max", "text": "Max's second sentence" },
                { "speaker": "Anna", "text": "Anna's second sentence" }
              ]

              Now, generate a dialogue using the word '${word}'.
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
