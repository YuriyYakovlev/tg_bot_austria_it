//audioService.js
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
// const {SpeechClient} = require('@google-cloud/speech').v1;
// const {Storage} = require('@google-cloud/storage');
const { Readable } = require("stream");
const concat = require("concat-stream");
const tmp = require('tmp'); 
const fs = require('fs');


const client = new TextToSpeechClient({
    projectId: process.env.PROJECT_ID,
});


async function generatePause(pauseDuration = 2000) {
    try {
        const ssmlText = `
            <speak>
                <break time="${pauseDuration}ms"/>
                bye.
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
    for (let i = 0; i < Math.max(manSentences.length, womanSentences.length); i++) {
      if (manSentences[i]) {
        audioStreams.push(await generateAudioForLanguage(manSentences[i], langCode, `${langCode}-Journey-D`));
      }
      if (womanSentences[i]) {
        audioStreams.push(await generateAudioForLanguage(womanSentences[i], langCode, `${langCode}-Journey-F`));
      }
    }
    audioStreams.push(await generatePause(5000));
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

/**
 * Generates SRT captions for a given local audio file.
 */
// async function generateSRTCaptions(audioFilePath, languageCode = 'uk-UA', alternativeLanguages = []) {
//     let audioUrl = await saveAudioToGCS(audioFilePath, 'audio.mp3');
//     const speechClient = new SpeechClient();

//     const request = {
//         audio: { uri: audioUrl },
//         config: {
//             encoding: 'MP3',
//             languageCode: languageCode,
//             alternativeLanguageCodes: alternativeLanguages,
//             enableWordTimeOffsets: true,
//         }
//     };

//     try {
//         const [response] = await speechClient.recognize(request);

//         let subtitleIndex = 1;
//         let srtCaptions = '';

//         response.results.forEach((result) => {
//             const words = result.alternatives[0].words;
//             if (!words || words.length === 0) return;

//             let chunkText = '';
//             let startTime = words[0].startTime.seconds + words[0].startTime.nanos / 1e9; // Convert to seconds
//             let endTime = words[words.length - 1].endTime.seconds + words[words.length - 1].endTime.nanos / 1e9; // Convert to seconds

//             // Apply multiplication factor to reduce timing
//             const multiplicationFactor = 0.07; // 0.1
//             startTime *= multiplicationFactor;
//             endTime *= multiplicationFactor;

//             words.forEach((word, index) => {
//                 const wordStart = word.startTime.seconds + word.startTime.nanos / 1e9; // Convert to seconds
//                 const wordEnd = word.endTime.seconds + word.endTime.nanos / 1e9; // Convert to seconds

//                 // Apply the multiplication factor to individual word timings
//                 const scaledStart = wordStart * multiplicationFactor;
//                 const scaledEnd = wordEnd * multiplicationFactor;

//                 chunkText += word.word + ' ';

//                 // Create a subtitle entry if the word duration exceeds a threshold (e.g., 0.5 seconds)
//                 if (scaledEnd - scaledStart > 0.5 || index === words.length - 1) {  // Adjust threshold as needed
//                     srtCaptions += `${subtitleIndex++}\n${formatTime(scaledStart)} --> ${formatTime(scaledEnd)}\n${chunkText.trim()}\n\n`;
//                     chunkText = '';
//                 }
//             });

//             // For the last part of the sentence, add the final timing and text.
//             if (chunkText.trim()) {
//                 srtCaptions += `${subtitleIndex++}\n${formatTime(startTime)} --> ${formatTime(endTime)}\n${chunkText.trim()}\n\n`;
//             }
//         });

//         return srtCaptions;
//     } catch (error) {
//         console.error('Error generating SRT captions:', error);
//         return null;
//     }
// }

/**
 * Helper function to format time for SRT (HH:MM:SS,MMM)
 */
// function formatTime(seconds) {
//     const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
//     const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
//     const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
//     const milliseconds = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    
//     return `${hours}:${minutes}:${secs},${milliseconds}`;
// }

// async function saveAudioToGCS(audioFilePath, fileName) {
//     const storage = new Storage();
//     const bucket = storage.bucket(bucketName);

//     const file = bucket.file(fileName);
//     const audioBuffer = fs.readFileSync(audioFilePath); 
//     await file.save(audioBuffer, {
//         resumable: false,
//         contentType: 'audio/mp3',
//     });

//     return `${bucketName}/${fileName}`;
// }

module.exports = {
    generateMultilingualAudioConcatenated,
    generateGermanAudioConcatenated,
    generateDialogueAudioConcatenated,
    mergeAudioStreams,
    generateDigestDialogueAudioConcatenated,
    saveAudioStreamToFile
    // generateSRTCaptions
};
