// textUtils.js

function split(message, maxLength = 4098) {
    const messageChunks = [];
    while (message.length > 0) {
      let chunk = message.slice(0, maxLength);
  
      const lastOpeningTagIndex = chunk.lastIndexOf('<');
      const lastClosingTagIndex = chunk.lastIndexOf('>');
      if (lastOpeningTagIndex > lastClosingTagIndex) {
        const closingTagIndex = message.indexOf('>', lastOpeningTagIndex);
        if (closingTagIndex !== -1) {
          chunk = message.slice(0, closingTagIndex + 1);
        }
      }
  
      messageChunks.push(chunk);
      message = message.slice(chunk.length);
    }
    return messageChunks;
  }

module.exports = { split };
