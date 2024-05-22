// questionDetectorService.js
const nlp = require('compromise');

const questionWords = [
  'who', 'what', 'where', 'when', 'why', 'how', 'is', 'are', 'can', 'do', 'does', 'did', 'could', 'would', 'should',
  'хто', 'що', 'де', 'коли', 'чому', 'як', 'чи', 'може', 'можете', 'зробити', 'зробили', 'підкажіть',
  'кто', 'что', 'где', 'когда', 'почему', 'как', 'ли', 'может', 'можете', 'сделать', 'сделали', 'подскажите'
];
const questionPhrases = [
  "could you tell me", "do you know", "is it possible", "would you mind", "can you explain",
  "чи могли б ви сказати", "чи знаєте ви", "чи можливо", "чи не заперечуєте", "чи можете пояснити",
  "могли бы вы сказать", "знаете ли вы", "возможно ли", "не возражаете ли", "можете объяснить"
];

function isQuestion(message) {
  const lowerMessage = message.toLowerCase();

  // Simple checks for question mark, question words, and phrases
  if (lowerMessage.includes('?')) {
    return true;
  }

  const words = lowerMessage.split(' ');
  if (words.length > 0 && questionWords.includes(words[0])) {
    return true;
  }

  for (let phrase of questionPhrases) {
    if (lowerMessage.includes(phrase)) {
      return true;
    }
  }

  // NLP analysis
  const doc = nlp(message);
  const terms = doc.terms().out('array');
  const firstTerm = terms[0];

  if (firstTerm && ['QuestionWord', 'Auxiliary', 'Verb'].includes(firstTerm.tags[0])) {
    return true;
  }

  return false;
}

// Example usage
console.log(isQuestion("What is your name?")); // true
console.log(isQuestion("Скажіть мені своє ім'я.")); // false
console.log(isQuestion("Вы можете помочь мне с этим?")); // true
