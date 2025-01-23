// vacanciesService.js
const { VertexAI }  = require("@google-cloud/vertexai");
const moment = require('moment');
const textUtils = require("../utils/textUtils");


let vertexAI = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

async function postNewVacancies(bot) {
  try {
    const result = await fetchNewVacancies();
    if (!result) {
      console.log("No new vacancies found.");
      return;
    }

    const groupedVacancies = groupVacanciesByCategory(result.vacancies);
    let message = 'Доброго ранку, спільното! Ось огляд цікавих вакансій 🇦🇹:\n\n';

    for (const [category, vacancies] of Object.entries(groupedVacancies)) {
      message += `🔹 <b>${category}</b>\n`;

      vacancies.forEach(vacancy => {
        message += `<b>${vacancy.position}</b> в <em>${vacancy.company}</em>\n`;
        if (vacancy.city && vacancy.city !== 'Not specified') {
          message += `<u>Локація</u>: ${vacancy.city}\n`;
        }
        if (vacancy.tech_stack && vacancy.tech_stack !== 'Not specified') {
          message += `<u>Tech Stack</u>: ${vacancy.tech_stack}\n`;
        }
        if (vacancy.salary && vacancy.salary !== 'Not specified') {
          message += `<u>Дохід</u>: ${vacancy.salary}\n`;
        }
        if (vacancy.benefits && vacancy.benefits !== 'Not specified') {
          message += `<u>Benefits</u>: ${vacancy.benefits}\n`;
        }
        message += `\n`;
      });
      message += '\n';
    }

    // console.log(message);

    message += `Зверніть увагу: Вакансії зібрані з відкритих джерел. Для подання заявки зверніться до компаній напряму.\n\n`;
    message += `Джерела: ${result.sources}\n\n
                Бажаю всім продуктивного тижня!`;

    const chatId = process.env.GROUP_ID; 
    const threadId = process.env.VACANCIES_THREAD_ID; 
    
    const messageChunks = textUtils.split(message);
    for (const chunk of messageChunks) {
      await bot.sendMessage(chatId, chunk, {
        message_thread_id: threadId,
        parse_mode: "HTML",
      });
    }
  } catch (error) {
    console.error("Error posting new vacancies:", error.message);
  }
}

async function fetchNewVacancies() {
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
    let result;
    try {
      result = JSON.parse(textResponse);
    } catch (err) {
      console.error('Failed to parse the vacancies:', err.message);
      return;
    }
    return result;
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
              We are an IT community of Ukrainians who have relocated to Austria and are actively seeking work opportunities. 
              Most of us are private entrepreneurs and many are still learning German. 
              Therefore, we prioritize vacancies that either:
               - Do not have strict German language requirements, or
               - Are explicitly open to English-speaking candidates.
              
              You are an assistant for this group, specializing in Information Technologies in Austria. 
              Your task is to compile a concise list of up to 20 new IT-related vacancies in Austria, grouped by technologies (e.g., Frontend, Backend, DevOps, Data Science, etc.).

              Important considerations:
               - Prioritize vacancies suitable for English-speaking professionals with limited German proficiency.
               - Include freelance or contract-based roles if available.
               - Avoid listing vacancies that do not mention the company name.
              
              Today is ${period}.
              
              Output should be a JSON: 
              { 
                "vacancies" : [
                  {
                    "position" : "position name (on original language)", 
                    "company : "company name",
                    "category": "technology category (e.g., Frontend, Backend, DevOps, etc.)",
                    "city": "define city name or remote", 
                    "tech_stack": "list of required tech stack (on original language). Skip if not defined.",
                    "salary" : "salary level in EURO. Skip if not defined.",
                    "benefits" : "benefits, if defined (on Ukrainian)"
                  },
                ],
                "sources" : "sources of information, for example: devjobs.at, karriere.at, metajob.at, startup.jobs"
              }
            `,
          },
        ],
      },
    ],
  };
}

function groupVacanciesByCategory(vacancies) {
  const grouped = {};
  
  // Group vacancies by category
  vacancies.forEach(vacancy => {
    if (vacancy.company && vacancy.company !== 'Various Companies') {
      const category = vacancy.category || "Інші";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(vacancy);
    }
  });

  // Reassign single-vacancy groups to 'Інші'
  const otherCategory = "Інші";
  grouped[otherCategory] = grouped[otherCategory] || [];

  Object.entries(grouped).forEach(([category, vacancyList]) => {
    if (vacancyList.length === 1 && category !== otherCategory) {
      grouped[otherCategory].push(...vacancyList);
      delete grouped[category];
    }
  });

  // Remove empty categories
  Object.keys(grouped).forEach(category => {
    if (grouped[category].length === 0) {
      delete grouped[category];
    }
  });

  return grouped;
}

module.exports = {
  postNewVacancies
};
