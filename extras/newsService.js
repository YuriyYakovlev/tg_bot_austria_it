// newsService.js
const { VertexAI }  = require("@google-cloud/vertexai");


const moment = require('moment');
const textUtils = require("../utils/textUtils");
const imageGenService = require("./imageGenService");

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function postNewsDigest(bot) {
  try {

    const news = await fetchNewsDigest();
    if (!news) {
      console.log("No upcoming news found.");
      return;
    }

    let caption = `<b>Доброго ранку друзі, ось що відбувалось в австрійському ІТ минулого тижня</b>:\n\n`;
    let message = "";
    if(news.analytics && news.analytics.length > 0) {
      message += `<b>Аналітика</b>\n`;
      for(let i = 0; i < news.analytics.length; i++) {
        message += `${news.analytics[i].item}\n\n`;
        break;
      }
    }

    if(news.news_digest && news.news_digest.length > 0) {
      message += `<b>Дайджест новин</b>\n`;
      for(let i = 0; i < news.news_digest.length; i++) {
        message += `${news.news_digest[i].item}\n\n`;
        break;
      }
    }

    if(news.challenges_opportunities && news.challenges_opportunities.length > 0) {
      message += `<b>Виклики та можливості</b>\n`;
      for(let i = 0; i < news.challenges_opportunities.length; i++) {
        message += `${news.challenges_opportunities[i].item}\n\n`;
        break;
      }
    }

    message += `<u>Джерела</u>: ${news.sources}`;

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.EVENTS_THREAD_ID; 
    
    const image = await imageGenService.generateImage('Central part of Vienna, Austria. Reallistic photo.');
    if (image) {
      await bot.sendPhoto(chatId, image, {
        parse_mode: "HTML",
        message_thread_id: threadId,
      });
    }

    const messageChunks = textUtils.split(`${caption}${message}`);
    for (const chunk of messageChunks) {
      await bot.sendMessage(chatId, chunk, {
        message_thread_id: threadId,
        parse_mode: "HTML",
      });
    }

    await bot.sendMessage(chatId, `<em>${news.question}</em>`, {
      message_thread_id: threadId,
      parse_mode: "HTML",
    });
    
  } catch (error) {
    console.error("Error posting  news:", error.message);
  }
}

async function fetchNewsDigest() {
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
    // const groundingMetadata = response.candidates[0].groundingMetadata;
    // console.log("GroundingMetadata is: ", JSON.stringify(groundingMetadata));

    let textResponse = response.candidates[0].content.parts[0].text;
    textResponse = textResponse.replaceAll('*', '').replaceAll('```json', '').replaceAll('```', '');

    //console.log(textResponse);
    let news;
    try {
      news = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse the news:', err.message);
      return;
    }

    return news;
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
              Your task is to compile a concise report on recent developments and news in the software development sector in Austria.
              Focus on news and updates from the past week, as of ${period}. 
              Ensure a balanced and realistic tone. Do not only focus on positive news. 
              Include news that reflects challenges, uncertainties, and shifts in the market.

              Group report on these categories:

              Analytics
              - Analysis of demand for specific IT skills and technologies in Austria today (${period}). Two sentences maximum. Highlight entry-level and mid-level opportunities. Mention any shifts in required skills compared to the previous period. Don't mention salaries. If the information is not reliable, do not include it.
             
              News Digest
              - Digest of significant news and events in the Austrian IT sector over the past week, around ${period}. Two sentences maximum. 
              Include news about:
                  - Changes in Austrian IT job market conditions (e.g., hiring freezes, layoffs, new investments).
                  - Updates on regulations or policies affecting IT professionals.
                  - Major projects or initiatives in the Austrian IT sector that could create opportunities.
                  - News about established Austrian IT companies (e.g., expansions, new product launches, partnerships).
                  - New Austrian IT startups that are hiring or have recently announced funding rounds in the past week. Don't mention about startups, which are not related to and were not founded in Austria.

              Challenges & Opportunities
              - A balanced overview of current challenges and opportunities in the Austrian IT sector. Two sentences maximum. 
              This may include:
                  - Discussion of skills gaps or areas of high demand and potential opportunities.
                  - Reports on salary trends (if reliable data becomes available, but still avoid focusing solely on salary).

              Output language: Ukrainian.
              Output should be a JSON:
              {
                "analytics" : [
                  {
                    "item" : "description",
                  },
                ],
                "news_digest" : [
                  {
                    "item" : "description",
                  },
                ],
                "challenges_opportunities" : [
                  {
                    "item" : "description",
                  },
                ],
                "sources" : "sources of information, for example: The Recursive, Vindobona, Revli, EU-Startups, Tech Funding News, Austrian government websites, local IT communities",
                "question": "a very short question, based on the presented news, to initiate the discussion in the chat. Start with: 'Як ви вважаєте...'"
              }
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  postNewsDigest
};
