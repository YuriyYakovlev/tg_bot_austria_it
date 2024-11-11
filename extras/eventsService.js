const axios = require("axios");
const xml2js = require("xml2js");
const moment = require("moment");


// Fetch and parse RSS feed
async function fetchRSSFeed(url) {
  try {
    const response = await axios.get(url);
    const rssData = await xml2js.parseStringPromise(response.data, { mergeAttrs: true });
    return rssData;
  } catch (error) {
    console.error("Failed to fetch RSS feed:", error);
    throw new Error("Could not load RSS feed.");
  }
}

function filterEvents(events, location, types, upcomingDays = 7) {
  const filteredEvents = events.filter((event) => {
    const eventTitle = event.title[0];
    const eventDescription = event.description[0];

    // Extract date from description using regex
    const dateMatch = eventDescription.match(/(\b\w+ \d{1,2}, \d{4}\b)/);
    const eventDate = dateMatch ? moment(dateMatch[0], "MMMM D, YYYY") : null;

    if (!eventDate) {
      console.warn(`Could not parse date for event: ${eventTitle}`);
      return false;
    }

    const currentDate = moment();
    const withinWeek = eventDate.isBetween(currentDate, currentDate.clone().add(upcomingDays, 'days'), null, '[]');

    // Check if event matches location
    const matchesLocation = new RegExp(location, 'i').test(eventDescription);

    // Check if the event type matches one of the specified types in the category array
    const matchesType = event.category && event.category.some((cat) => types.includes(cat.toLowerCase()));

    return matchesLocation && matchesType && withinWeek;
  });

  return filteredEvents;
}


async function fetchAndFilterEvents() {
  try {
    const rssData = await fetchRSSFeed("https://dev.events/rss.xml");

    // Retrieve events
    const events = rssData.rss.channel[0].item;
    const filteredEvents = filterEvents(events, "Austria", ["meetup", "conference"]);

    return filteredEvents.map((event) => {
      const description = event.description[0];

      // Extract date from description
      const dateMatch = description.match(/(\b\w+ \d{1,2}, \d{4}\b)/);
      const eventDate = dateMatch ? moment(dateMatch[0], "MMMM D, YYYY") : null;

      // Format event date if parsed successfully
      const formattedDate = eventDate ? eventDate.format("YYYY-MM-DD") : "Unknown date";

      return {
        city: extractCity(description),
        date: formattedDate,
        title: event.title[0],
        //description: description,
        //link: event.link[0],
      };
    });
  } catch (error) {
    console.error("Error fetching and filtering events:", error);
    throw new Error("Could not process events.");
  }
}


// Extract city from description (optional, based on data format)
function extractCity(description) {
  const match = description.match(/(?:in|at)\s+([A-Za-z\s]+)/i);
  return match ? match[1].trim() : "Online";
}

// Summarize events using Vertex AI
async function summarizeEvents() {
  try {
    const filteredEvents = await fetchAndFilterEvents();
    if (filteredEvents.length === 0) {
      return "No upcoming events found for the specified criteria.";
    } else {
      return filteredEvents;
    }
  } catch (error) {
    console.error("Error in summarizeEvents:", error);
  }
}

module.exports = {
  summarizeEvents,
};
