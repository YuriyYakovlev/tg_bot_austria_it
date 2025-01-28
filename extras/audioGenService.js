// audioGenService.js (modified for concatenation)
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { Readable } = require('stream');
const concat = require('concat-stream');

async function generateAudioForLanguage(text, languageCode, voiceName) {
    let audioContent = '';
    const client = new TextToSpeechClient({
        projectId: process.env.PROJECT_ID,
    });
    try {
        const [response] = await client.synthesizeSpeech({
            input: { text },
            voice: {
                languageCode: languageCode,
                name: voiceName
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate : 1.0
            },
        });
        if (response.audioContent) {
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


async function generateMultilingualAudioConcatenated(wordGerman, wordUkrainian, ukrainianText, germanText) {
    const ukrainianWordAudioStream = await generateAudioForLanguage(wordUkrainian, "uk-UA", "uk-UA-Wavenet-A");
    const ukrainianTextAudioStream = await generateAudioForLanguage(ukrainianText, "uk-UA", "uk-UA-Wavenet-A");
    const germanWordAudioStream = await generateAudioForLanguage(wordGerman, "de-DE", "de-DE-Studio-B");
    const germanTextAudioStream = await generateAudioForLanguage(germanText, "de-DE", "de-DE-Studio-B");

    if (!ukrainianWordAudioStream || !ukrainianTextAudioStream || !germanWordAudioStream || !germanTextAudioStream) {
        return null;
    }

    return new Promise((resolve, reject) => {
        const combinedStream = new Readable();
        combinedStream._read = () => {};

        germanWordAudioStream.pipe(concat(germanWordBuffer => { // 1. German word first
            combinedStream.push(germanWordBuffer);
            ukrainianWordAudioStream.pipe(concat(ukrainianWordBuffer => { // 2. Ukrainian word second
                combinedStream.push(ukrainianWordBuffer);
                ukrainianTextAudioStream.pipe(concat(ukrainianTextBuffer => { // 3. Ukrainian text third
                    combinedStream.push(ukrainianTextBuffer);
                    germanTextAudioStream.pipe(concat(germanTextBuffer => { // 4. German text fourth
                        combinedStream.push(germanTextBuffer);
                        combinedStream.push(null); // Signal end of stream
                        resolve(combinedStream);
                    }))
                    .on('error', reject);
                }))
                .on('error', reject);
            }))
            .on('error', reject);
        }))
        .on('error', reject);
    });
}


module.exports = {
    generateMultilingualAudioConcatenated
};