const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { Readable } = require("stream");
const concat = require("concat-stream");

const client = new TextToSpeechClient({
    projectId: process.env.PROJECT_ID,
});

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
                speakingRate: 0,
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

/**
 * Generates and merges dialogue audio.
 */
async function generateDialogueAudioConcatenated(max_sentence1, max_sentence2, anna_sentence1, anna_sentence2) {
    const audioStreams = await Promise.all([
        generateAudioForLanguage(max_sentence1, "en-US", "en-US-Journey-D"),
        generateAudioForLanguage(anna_sentence1, "en-US", "en-US-Journey-F"),
        generateAudioForLanguage(max_sentence2, "en-US", "en-US-Journey-D"),
        generateAudioForLanguage(anna_sentence2, "en-US", "en-US-Journey-F"),
    ]);

    return mergeAudioStreams(audioStreams);
}

async function generateDigestDialogueAudioConcatenated(manSentences, womanSentences) {
    let audioStreams = [];
    for (let i = 0; i < Math.max(manSentences.length, womanSentences.length); i++) {
      if (manSentences[i]) {
        audioStreams.push(await generateAudioForLanguage(manSentences[i], "en-US", "en-US-Journey-D"));
      }
      if (womanSentences[i]) {
        audioStreams.push(await generateAudioForLanguage(womanSentences[i], "en-US", "en-US-Journey-F"));
      }
    }
    return mergeAudioStreams(audioStreams);
}

module.exports = {
    generateMultilingualAudioConcatenated,
    generateDialogueAudioConcatenated,
    mergeAudioStreams,
    generateDigestDialogueAudioConcatenated
};
