// languageService.js
const en = require('../lang/en');
const uk = require('../lang/uk');

const languages = {
  en,
  uk,
};

function getMessages(langCode = 'en') {
  return languages[langCode] || languages.en;
}

module.exports = {
  getMessages,
};
