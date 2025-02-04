// eventsService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');
const textUtils = require("../utils/textUtils");


let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function postWeekendEvents(bot) {
  try {
    const events = await fetchUpcomingEvents();
    if (!events) {
      console.log("No upcoming events found.");
      return;
    }

    let message = 'Дайджест цікавих подій на ці вихідні 🇦🇹:\n\n';

    const groupedEvents = groupEventsByDateAndCity(events);
    for (const date of Object.keys(groupedEvents)) {
      message += `🔹 <b>${date}</b> \n`;
      const cities = groupedEvents[date];

      for (const city of Object.keys(cities)) {
        message += `<b>${city}</b>\n`;
        const cityEvents = cities[city];

        for (const event of cityEvents) {
          message += `• ${event.description}\n`;
        }
        message += '\n';
      }
    }

    //message += `\n<code>Дайджест сформовано із використанням ШІ. Можливі неточності або неповнота інформації.</code>`;


    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.WEEKEND_THREAD_ID; 
    
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

function groupEventsByDateAndCity(events) {
  const grouped = {};

  for (const event of events) {
    const { date, city } = event;

    const formattedDate = formatDateWithDayOfWeek(date);
    if (!grouped[formattedDate]) {
      grouped[formattedDate] = {};
    }

    if (!grouped[formattedDate][city]) {
      grouped[formattedDate][city] = [];
    }

    grouped[formattedDate][city].push(event);
  }

  return grouped;
}

function formatDateWithDayOfWeek(date) {
  try {
    const parsedDate = moment(date, "DD.MM", true);
    if (!parsedDate.isValid()) {
      throw new Error("Invalid date format");
    }
    const dayOfWeek = parsedDate.locale("uk").format("dddd");
    const formattedDate = `${parsedDate.format("DD MMMM")} (${dayOfWeek})`;
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  } catch (error) {
    console.error(`Failed to parse date '${date}': ${error.message}`);
    return "This Weekend";
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

    //console.log(textResponse);
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
              Find a list of top interesting events in Austria for this weekend (Saturday and Sunday).
              Today is ${period}.
              Double check, that events are relevant.
              
              Output language: Ukrainian.
              Output should be a JSON array: 
              [ 
                {
                  "date": “date of EVENT (dd.mm)”, 
                  "city": "city where EVENT takes place", 
                  "location": "location where EVENT takes place", 
                  "description": "details of the EVENT, such as: name on original language, type of event on ukrainian language.”
              ]

              No intro or summary. Just provide me a JSON.
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  postWeekendEvents
};
