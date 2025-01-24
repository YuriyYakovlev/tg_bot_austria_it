// audioGenService.js
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { Readable } = require('stream');

async function generateAudio(text) {
    let audioContent = '';
    const client = new TextToSpeechClient({
        projectId: process.env.PROJECT_ID,
    });
    try {
        const [response] = await client.synthesizeSpeech({
            input: { text },
            voice: { 
                languageCode: "de-DE", 
                name: "de-DE-Studio-B" 
            },
            audioConfig: { 
                audioEncoding: 'MP3', // "LINEAR16"
                speakingRate : 1.0
            },
        });
        if (response.audioContent) {
            //audioContent = Buffer.from(response.audioContent).toString('base64');
            const audioStream = new Readable();
            audioStream._read = () => {};
            audioStream.push(response.audioContent);
            audioStream.push(null);
            return audioStream;
        }
        return audioContent;

    } catch (error) {
        console.log('error', error.message);
        return null;
    }
}

module.exports = {
    generateAudio,
};