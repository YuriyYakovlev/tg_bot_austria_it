// newsService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');

let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function postNewsDigest(bot) {
  try {
    const news = await fetchNewsDigest();
    if (!news) {
      console.log("No upcoming events found.");
      return;
    }

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.NEWS_THREAD_ID; 
    
    await bot.sendMessage(chatId, news, {
        message_thread_id: threadId,
        parse_mode: "HTML"
    });
  } catch (error) {
    console.error("Error posting monthly events:", error.message);
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
    let textResponse = response.candidates[0].content.parts[0].text;
    textResponse = textResponse.replaceAll('*', '');
    textResponse = textResponse.replaceAll('<br>', '');
    //console.log(textResponse);
    return textResponse;
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
              Your task is to compile a concise report on recent developments in the software development sector in Austria. 
              Focus on news and updates from the past week, as of ${period}.
              
              Group report on these categories:
              <b>Analytics</b>
              - New vacancies and trends in the IT market in Austria today (${period}).
              - Statistics on required technologies
              - Don't mention salaries. If the information is not reliable, do not include it.
              
              <b>Startups</b>
              - New startups our IT companies from Austria, which appeared in the news of the past week.
              - Don't mention about startups, which are not related to and were not founded in Austria.
              - If there is not enough information about startups from Austria, skip 'Startups' section.

              <b>Digest of news</b>
               - Describe the news from Austrian IT over the past week, around ${period}.

              Make sure that:
              - Information is related to past week. Do not include news which are more than 14 days old.
              - Balancing tone: present both positive, neutral and negative news.

              Each group should contain up to 5 items.
              Separate groups with double line break.
              
              Use this formatting for news items:
              • news item - short description

              Output language: Ukrainian.

              Example of testimonials:
                - Доброго раночку друзі, ось що відбувалось в австрійському ІТ минулого тижня.
                - Вітаю, спільното. Минулого тижня були такі події в австрійському ІТ.
                - Всім салют. Цього разу в нашій підбірці дайджест новин за минулий тиждень.
              

              At the end, add a short question, based on the presented news, to initiate the discussion in the chat.

              Complete by "Sources" section:
               - public sources, which were used for the preparation of news digest.
              For example:
                Джерела: Sifted, Nucamp, Tech.eu, AustriaTech, The Recursive, Vindobona, Revli, EU-Startups, Tech Funding News, DEVjobs.at, Developer Tech.

              Don't duplicate greetings in your answer.
              Use emoji.
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
