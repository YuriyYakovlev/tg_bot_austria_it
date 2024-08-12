// newsService.js
const NewsAPI = require("newsapi");
const vertexAi = require("@google-cloud/vertexai");
const moment = require("moment");

const getNewsApiKey = async () => {
  return process.env.NEWS_API_KEY;
};

let vertexAiClient = new vertexAi.VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function fetchEvents(countryCode, category) {
  try {
    const apiKey = await getNewsApiKey();
    this.newsapi = new NewsAPI(apiKey);

    const response = await this.newsapi.v2.topHeadlines({
      //country: countryCode,
      category: category
    });

    if (response.status === "ok") {
      const articles = response.articles;
      const newsHeadlines = articles
        .slice(0, 10)
        .map((article) => article.title);
      return newsHeadlines.join(". ");
    } else {
      throw new Error("Failed to load news");
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

async function summarizeEvents() {
  try {
    let textResponse = "";
    //const news = await fetchNews("Ukrainian", "technology");
    //if (news) {
      const request = prepareSummarizationRequest("Ukrainian", "Austria", "Vienna, Graz, Salzburg, Innsbruck");

      const generativeModel = vertexAiClient.preview.getGenerativeModel({
        model: process.env.AI_MODEL,
        generation_config: {
          max_output_tokens: 500,
          temperature: 0,
          top_p: 1,
        }
      });

      const summarizationResponse = await generativeModel.generateContentStream(
        request
      );
      textResponse = (await summarizationResponse.response).candidates[0]
        .content.parts[0].text;
      textResponse = cleanupText(textResponse);
    //}
    return textResponse;
  } catch (error) {
    console.error("Error in summarizeNews:", error);
  }
}

function cleanupText(text) {
  let cleanedText = text
    .replace(/\\n\\n/g, "\n") 
    .replace(/\n\s*\n/g, "\n")
    .replace(/\*\*/g, "\n")
    .replace(/\*/g, " ")
    .replace(/[#\:]/g, "")
    .trim();         
  return cleanedText;
}

function prepareSummarizationRequest(language, country, cities) {
  const today = moment().format("YYYY-MM-DD");
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
                ### Instructions. 
                You are an artificial intelligence assistant in IT Telegram chat. Your task is to suggest upcoming events.
                List and summarize only events in these categories: IT, AI, Technology, Blockchain, Cybersecurity.
                Upcoming period should be 2 weeks.
                Output language should be: ${language}
                Country : ${country}
                Cities : ${cities}
                Today is: ${today}
                ### Format of output:
                 - city
                 - date: event title (original language). short descrtiption (on ${language}). link ro website
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  summarizeEvents,
};
