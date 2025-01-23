// eventsService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');
const textUtils = require("../utils/textUtils");


let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function postUpcomingEvents(bot) {
  try {
    const events = await fetchUpcomingEvents();
    if (!events) {
      console.log("No upcoming events found.");
      return;
    }

    let message = 'Вітаю, спільното. Нагадую, що цього місяця відбудуться такі події та мітапи 🇦🇹:\n\n';
    for(let i = 0; i < events.length; i++) {
      message += `${events[i].date} - <em>${events[i].location}</em> - <strong>${events[i].name}</strong> - ${events[i].description}\n\n`;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.EVENTS_THREAD_ID; 
    
    const messageChunks = textUtils.split(message);
    for (const chunk of messageChunks) {
      await bot.sendMessage(chatId, chunk, {
        message_thread_id: threadId,
        parse_mode: "HTML",
      });
    }

  } catch (error) {
    console.error("Error posting monthly events:", error.message);
  }
}

async function fetchUpcomingEvents() {
  try {

    const currentMonthYear = moment().format("DD MMMM YYYY");
    const request = prepareRequest(currentMonthYear);
    const generativeModel = vertexAI.getGenerativeModel({
      model: process.env.AI_MODEL,
      generation_config: {
        max_output_tokens: 1000,
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
    textResponse = textResponse.replaceAll('*', '').replaceAll('```json', '').replaceAll('```', '');

    let events;
    try {
      events = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse the events:', err.message);
      return;
    }
    //console.log(events);
    return events;
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
              You are an assistant specializing in information technology in Austria.
              Find a list of upcoming conferences, webinars and meetings in Austria for the current month. 
              Today is ${period}.
              Double check, that events are relevant.
              
              Output should be a JSON array: 
              [ 
                {
                  "date": “date of EVENT (dd.mm)”, 
                  "location": "location of EVENT (on Ukrainian)", 
                  "name": "name of EVENT (on original language)", 
                  "description": “description of EVENT (on Ukrainian)”
              ]
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  postUpcomingEvents
};
