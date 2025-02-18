// eduService.js
const { VertexAI } = require("@google-cloud/vertexai");

const audioService = require("../media/audio/audioService");
const imageService = require("../media/imageService");
const videoService = require("../media/videoService");
const utils = require("./utils");


let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});


async function postMikaTest(bot) {
  let attempts = 0;
  const maxRetries = 2;
  let image = null;
  let mikaTest = null;
  const chatId = process.env.GROUP_ID;

  while (!image && attempts < maxRetries) {
    mikaTest = await fetchMikaTest(chatId); // Regenerate the entire test
    if (!mikaTest) {
      throw new Error("No Mika test found.");
    }
    //console.log(mikaTest.image_prompt);

    // Generate image
    image = await imageService.generateImage(mikaTest.image_prompt, 
      "Style: basic, using only black outlines on a plain, light background. No shading or complex details.");
    attempts++;

    if (!image) {
      console.log(`Image generation failed. Retrying... (${attempts}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
  }

  // If image generation still failed after retries, exit
  if (!image) {
    throw new Error("Image generation failed after multiple attempts.");
  }

  // Construct vocabulary message
  let vocabulary = "<u>Словник:</u>\n";
  for (let i = 0; i < mikaTest.vocabulary.length; i++) {
    vocabulary += `${mikaTest.vocabulary[i].word} - <i>${mikaTest.vocabulary[i].ukrainian}</i>\n`;
  }

  // Construct main message
  let message = `<b>${mikaTest.image_description.german}</b>\n\n`;
  message += `<i>${mikaTest.image_description.ukrainian}</i>\n`;
  message += `\n<u>Запитання:</u>\n`;
  for (let i = 0; i < mikaTest.questions.length; i++) {
    message += `<b>${mikaTest.questions[i].question_de}</b> - ${mikaTest.questions[i].answer_de}\n`;
    message += `<i>${mikaTest.questions[i].question_ua} - ${mikaTest.questions[i].answer_ua}</i>\n\n`;
  }

  // Generate audio
  const audioDE = await audioService.generateAudioForLanguage(mikaTest.image_description.german, "de-DE", "de-DE-Studio-B");
  const audioUA = await audioService.generateAudioForLanguage(mikaTest.image_description.ukrainian, "uk-UA", "uk-UA-Wavenet-A");
  let audio = await audioService.mergeAudioStreams([audioDE, audioUA]);

  // Save audio to file
  const audioFilePath = await audioService.saveAudioStreamToFile(audio);
  const clickToListen = "(натисніть, щоб прослухати)";

  // Generate video
  const videoBuffer = await videoService.generateVideoAsBuffer(image, audioFilePath, clickToListen);

  // Send video to chat
  const threadId = process.env.MIKA_THREAD_ID;
  await bot.sendVideo(chatId, videoBuffer, {
    caption: vocabulary,
    parse_mode: "HTML",
    message_thread_id: threadId,
  });

  // Send message with questions
  await bot.sendMessage(chatId, message, {
    message_thread_id: threadId,
    parse_mode: "HTML",
  });

  await utils.addTopicToHistory(mikaTest.image_topic, chatId);
}


async function fetchMikaTest(chatId) {
  try {
    const previousTopics = await utils.fetchPreviousTopics(chatId);
    const request = prepareRequest(previousTopics);
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

    let testData;
    try {
      testData = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse the Mika test data:', err.message);
      console.log(textResponse);
      return;
    }

    if (testData && testData.image_topic) {
      return { 
        image_topic: testData.image_topic, image_prompt: testData.image_prompt, vocabulary: testData.vocabulary, 
        image_description: testData.image_description, questions: testData.questions };
    } else {
      console.error('Invalid data format:', textResponse);
      return;
    }
  } catch (error) {
    console.error('Error in fetchWordOfTheDay:', error.message);
  }
}

function prepareRequest(previousTopics) {
  const excludedTopics = previousTopics.length > 0 ? previousTopics.join(", ") : "none";
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
              You are an assistant specializing in language learning in Austria.
              You should generate a daily interactive German learning activity for Ukrainian students, based on the MIKA-D test format.

              **Examples stories for images:**
              "The man was playing football and hit a tree with the ball. A nest fell from the tree. There were eggs inside. The man took one egg home."
              "The woman was walking her dog when the dog started chasing a hare. The woman searched for the dog. The dog was found."

              **Questions and Answers requirements:**
               * Some of questions and answers should contain modal verbs
               * Some of questions and answers should use "nebensatz"
              Do not use these topics: ${excludedTopics}.
              
              **Output format should be in JSON:**
              {
                "image_prompt": "A prompt to generate an image that represents a real-world story. Can be divided into several panels.",
                "image_topic": "A topic for the image, for ex. der Bahnhof, das Bauernhaus, die Stadt, die Bäckerei"
                "vocabulary": [
                  {
                    "word": "German word with article. If it is verb, list all its forms, sepatated by /", 
                    "ukrainian": "Ukrainian translation without transcript"
                  }
                ],
                "image_description": {
                  "german": "An image description in German, using key vocabulary in context.",
                  "ukrainian": "Translation to Ukrainian",
                },
                "questions": [
                  {
                    "question_ua": "A simple question about the image in Ukrainian.",
                    "question_de": "The same question in German.",
                    "answer_de": "Suggested correct answer in German.",
                    "answer_ua": "Suggested correct answer in Ukrainian."
                  }
              }
              
              Let's try. Give me the MIKA Test for today.
              No intro or summary. Just generate JSON.
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  postMikaTest,
};
