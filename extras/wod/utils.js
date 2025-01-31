// utils.js
const db = require('../../db/connectors/dbConnector');

async function fetchPreviousWords(chatId = null) {
  const query = `SELECT word FROM word_of_the_day_history WHERE chat_id = ? OR chat_id IS NULL`;
  try {
    const [rows] = await db.query(query, [chatId]);
    return rows.map(row => row.word);
  } catch (error) {
    console.error('Error fetching previous words from the database:', error.message);
    return [];
  }
}

async function addWordToHistory(word, description, chatId = null) {
  const query = `INSERT INTO word_of_the_day_history (word, description, chat_id) VALUES (?, ?, ?)`;
  try {
    await db.query(query, [word, description, chatId]);
  } catch (error) {
    console.error('Error adding word to history:', error.message);
  }
}


module.exports = {
    fetchPreviousWords,
    addWordToHistory
};
