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

async function fetchNews(countryCode, category) {
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

async function summarizeNews() {
  try {
    let textResponse = "";
    const news = await fetchNews("Ukrainian", "technology");
    if (news) {
      const request = prepareSummarizationRequest("Ukrainian", news);

      const generativeModel = vertexAiClient.preview.getGenerativeModel({
        model: process.env.AI_MODEL,
        generation_config: {
          max_output_tokens: 500,
          temperature: 0,
          top_p: 1,
        },
      });

      const summarizationResponse = await generativeModel.generateContentStream(
        request
      );
      textResponse = (await summarizationResponse.response).candidates[0]
        .content.parts[0].text;
      textResponse = cleanupText(textResponse);
    }
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

function prepareSummarizationRequest(language, news) {
  const today = moment().format("YYYY-MM-DD");
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
                ### Instructions. 
                You are an artificial intelligence assistant in IT Telegram chat. Your task is to rewrite the given news headlines in a positive format.
                Include only news in the technology category in your summary.
                Do not include news that are:
                 - negative news
                 - news with no substance
                 - advertising news
                 - news about games and entertainment
                The output should be concise, not too long and reflect the main points. 
                Do not show the original headlines and categories, instead show your summary.
                Do not mention the criteria for this summary.
                Do not include links into output.
                Output language should be: ${language}
                The news are 24h old. Today is: ${today}
                ### News headlines for summary ${news}
            `,
          },
        ],
      },
    ],
  };
}

module.exports = {
  summarizeNews,
};
