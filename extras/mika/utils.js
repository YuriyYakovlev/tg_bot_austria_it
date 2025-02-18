// utils.js
const db = require('../../db/connectors/dbConnector');

async function fetchPreviousTopics(chatId = null) {
  const query = `SELECT topic FROM mika_history WHERE chat_id = ? OR chat_id IS NULL`;
  try {
    const [rows] = await db.query(query, [chatId]);
    return rows.map(row => row.topic);
  } catch (error) {
    console.error('Error fetching previous topics from the database:', error.message);
    return [];
  }
}

async function addTopicToHistory(topic, chatId = null) {
  const query = `INSERT INTO mika_history (topic, chat_id) VALUES (?, ?)`;
  try {
    await db.query(query, [topic, chatId]);
  } catch (error) {
    console.error('Error adding topic to history:', error.message);
  }
}


module.exports = {
  fetchPreviousTopics,
  addTopicToHistory
};
