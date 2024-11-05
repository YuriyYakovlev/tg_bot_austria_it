// languageService.js
const en = require('../lang/en');
const uk_it = require('../lang/uk_it');
const uk = require('../lang/uk');

const languages = {
  en,
  uk,
  uk_it
};

function getMessages(langCode = 'en') {
  return languages[langCode] || languages.en;
}

module.exports = {
  getMessages,
};
