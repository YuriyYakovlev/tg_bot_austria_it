//audioService.js
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { ElevenLabsClient } = require("elevenlabs");
const { Readable } = require("stream");
const concat = require("concat-stream");
const tmp = require('tmp'); 
const fs = require('fs');


const client = new TextToSpeechClient({
    projectId: process.env.PROJECT_ID,
});


async function generatePause(pauseDuration = 300) {
    try {
        const ssmlText = `
            <speak>
                <break time="${pauseDuration}ms"/>
            </speak>`;

        const [response] = await client.synthesizeSpeech({
            input: { ssml: ssmlText },
            voice: {
                languageCode: "en-US",
                name: "en-US-Standard-B",
            },
            audioConfig: {
                audioEncoding: "MP3",
            },
        });

        if (response.audioContent) {
            const audioStream = new Readable();
            audioStream._read = () => {};
            audioStream.push(response.audioContent);
            audioStream.push(null);
            return audioStream;
        }
        return null;
    } catch (error) {
        console.error("Error generating audio:", error.message);
        return null;
    }
}

async function generateAudioWithElevenLabs(text, voiceId) {
    const elClient = new ElevenLabsClient();
    const audio = await elClient.textToSpeech.convert(voiceId, {
      text: text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });
    return audio;
}

/**
 * Generates an audio stream for the given text and language.
 */
async function generateAudioForLanguage(text, languageCode, voiceName) {
    try {
        const [response] = await client.synthesizeSpeech({
            input: { text },
            voice: {
                languageCode: languageCode,
                name: voiceName,
            },
            audioConfig: {
                audioEncoding: "MP3",
                sampleRateHertz: 44100,
                audioChannelCount: 2,
                speakingRate: (voiceName==="de-DE--Journey-D" || voiceName==="de-DE--Journey-F")? 0.25 : 0,
                pitch: 0
            },
        });

        if (response.audioContent) {
            const audioStream = new Readable();
            audioStream._read = () => {};
            audioStream.push(response.audioContent);
            audioStream.push(null);
            return audioStream;
        }
        return null;
    } catch (error) {
        console.error("Error generating audio:", error.message);
        return null;
    }
}

/**
 * Merges multiple audio streams in order.
 */
async function mergeAudioStreams(audioStreams) {
    if (!audioStreams || audioStreams.some((stream) => !stream)) {
        console.error("Error: One or more audio streams are invalid.");
        return null;
    }

    return new Promise((resolve, reject) => {
        const combinedStream = new Readable();
        combinedStream._read = () => {};

        const processNext = (index) => {
            if (index >= audioStreams.length) {
                combinedStream.push(null); // Signal end of stream
                return resolve(combinedStream);
            }

            audioStreams[index].pipe(
                concat((buffer) => {
                    combinedStream.push(buffer);
                    processNext(index + 1);
                })
            ).on("error", reject);
        };

        processNext(0);
    });
}

/**
 * Generates and merges multilingual audio.
 */
async function generateMultilingualAudioConcatenated(wordGerman, wordUkrainian, ukrainianText, germanText) {
    const audioStreams = await Promise.all([
        generateAudioForLanguage(wordGerman, "de-DE", "de-DE-Studio-B"),
        generateAudioForLanguage(wordUkrainian, "uk-UA", "uk-UA-Wavenet-A"),
        generateAudioForLanguage(ukrainianText, "uk-UA", "uk-UA-Wavenet-A"),
        generateAudioForLanguage(germanText, "de-DE", "de-DE-Studio-B"),
    ]);

    return mergeAudioStreams(audioStreams);
}

async function generateGermanAudioConcatenated(wordGerman, germanText, langCode) {
    const audioStreams = await Promise.all([
        generateAudioForLanguage(wordGerman, langCode, `${langCode}-Studio-B`),
        generateAudioForLanguage(germanText, langCode, `${langCode}-Studio-B`),
    ]);
    return mergeAudioStreams(audioStreams);
}

/**
 * Generates and merges dialogue audio.
 */
async function generateDialogueAudioConcatenated(max_sentence1, max_sentence2, anna_sentence1, anna_sentence2, langCode) {
    const audioStreams = await Promise.all([
        generateAudioForLanguage(max_sentence1, langCode, `${langCode}-Journey-D`),
        generateAudioForLanguage(anna_sentence1, langCode, `${langCode}-Journey-F`),
        generateAudioForLanguage(max_sentence2, langCode, `${langCode}-Journey-D`),
        generateAudioForLanguage(anna_sentence2, langCode, `${langCode}-Journey-F`),
    ]);

    return mergeAudioStreams(audioStreams);
}

async function generateDigestDialogueAudioConcatenated(manSentences, womanSentences, langCode) {
    let audioStreams = [];
    switch (langCode) {
        case 'uk-UA':
            for (let i = 0; i < Math.max(manSentences.length, womanSentences.length); i++) {
                if (manSentences[i]) {
                    audioStreams.push(await generateAudioWithElevenLabs(manSentences[i], "9Sj8ugvpK1DmcAXyvi3a")); // Alex
                    // break; //debug
                }
                if (womanSentences[i]) {
                    console.log(womanSentences[i])
                    audioStreams.push(await generateAudioWithElevenLabs(womanSentences[i], "nCqaTnIbLdME87OuQaZY")); // Vira
                    // break; //debug
                }
            }
            break;
        default:
            for (let i = 0; i < Math.max(manSentences.length, womanSentences.length); i++) {
                if (manSentences[i]) {
                    audioStreams.push(await generateAudioForLanguage(manSentences[i], langCode, `${langCode}-Journey-D`));
                }
                if (womanSentences[i]) {
                    audioStreams.push(await generateAudioForLanguage(womanSentences[i], langCode, `${langCode}-Journey-F`));
                }
            }   
    } 
    //audioStreams.push(await generatePause(5000));
    return mergeAudioStreams(audioStreams);
}

async function saveAudioStreamToFile(stream) {
  const tmpFile = tmp.tmpNameSync({ postfix: '.mp3' });
  return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tmpFile);
      stream.pipe(writeStream)
          .on('finish', () => resolve(tmpFile))
          .on('error', reject);
  });
}

module.exports = {
    generateMultilingualAudioConcatenated,
    generateGermanAudioConcatenated,
    generateDialogueAudioConcatenated,
    mergeAudioStreams,
    generateDigestDialogueAudioConcatenated,
    saveAudioStreamToFile,
    generateAudioForLanguage
};
