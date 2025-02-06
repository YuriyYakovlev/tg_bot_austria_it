// dialogueService.js
const { VertexAI } = require("@google-cloud/vertexai");
const audioService = require("./audioService");
const moment = require('moment');

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function generateAudioDialogue(word, isSlang = false, langCode) {
  try {
    const dialogueData = await generateDialogue(word, isSlang);
    
    if (!dialogueData || !dialogueData.dialogue) {
      console.log("No dialogue found.");
      return;
    }
    const dialogue  = dialogueData.dialogue;

    const max_sentence1 = dialogue.dialogue[0].text
    const max_sentence2 = dialogue.dialogue[2].text
    const anna_sentence1 = dialogue.dialogue[1].text
    const anna_sentence2 = dialogue.dialogue[3].text

    
    let audio = await audioService.generateDialogueAudioConcatenated(
      max_sentence1, max_sentence2, anna_sentence1, anna_sentence2, langCode
    );

    //console.log(dialogue);
    //console.log(dialogue.image_prompt);
    
    return {
      audio: audio,
      image_prompt: dialogue.image_prompt
    };
 
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
      console.error('Raw response:', textResponse);
      return null;
    }

    if (!Array.isArray(dialogueData.dialogue)) {
      console.error('Invalid dialogue format:', dialogueData);
      return null;
    }

    return { dialogue: dialogueData };
  } catch (error) {
    console.error('Error in fetchWordOfTheDay:', error.message);
  }
}

function prepareRequest(word, isSlang) {
  const date = moment().format("DD MMMM YYYY");
  const slangNotice = isSlang 
  ? `The word '${word}' is Austrian slang.`
  : '';

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              You are a German teacher.  
              Your task is to generate a short, natural-sounding dialogue around a given word and a related image generation prompt.
              Get 1 most popular topic for today from today's news about the war in Ukraine. 
              Use this topic and a given word to generate a dialogue. The dialogue should feel everyday and personal rather than a discussion of the news. 
              Don't start with question: did you read or did you hear.
              Avoid any content that promotes Russian propaganda, misinformation, or narratives that justify aggression.
              Today is: ${date}

              Dialogue requirements:  
                - Use two speakers: Max and Anna.  
                - Each speaker should have two lines, making a total of four exchanges.  
                - The dialogue should be in German.  
                - Include real-life auxiliary words (e.g., "naja", "also").  

              Image Prompt Requirements:
                - The image prompt should be a concise description of a scene depicting the context of the dialogue.
                - It should be designed to generate a visually relevant and engaging image that complements the dialogue.
                - Include elements from the dialogue in the prompt.
                - Use descriptive and clear language.
                - Be written in English.

              ${slangNotice} 

              Output should be in JSON: 
              {
                "dialogue": [
                  { "speaker": "Max", "text": "Max's first sentence" },
                  { "speaker": "Anna", "text": "Anna's first sentence" },
                  { "speaker": "Max", "text": "Max's second sentence" },
                  { "speaker": "Anna", "text": "Anna's second sentence" }
                  ],
                "image_prompt": "A concise image generation prompt. The style should be cyberpunk."
              }

              Now, generate a dialogue and an image prompt using the word '${word}'.
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
