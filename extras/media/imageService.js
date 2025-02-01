// imageService.js

const aiplatform = require('@google-cloud/aiplatform');
const {PredictionServiceClient} = aiplatform.v1;
const {helpers} = aiplatform;
const sharp = require('sharp');

const clientOptions = {
  apiEndpoint: `${process.env.LOCATION}-aiplatform.googleapis.com`,
};

const predictionServiceClient = new PredictionServiceClient(clientOptions);


async function generateImage(prompt) {
    try {
        const endpoint = `projects/${process.env.PROJECT_ID}/locations/${process.env.LOCATION}/publishers/google/models/imagen-3.0-generate-002`;

        const promptText = {
            prompt: prompt,
        };
        const instanceValue = helpers.toValue(promptText);
        const instances = [instanceValue];

        const parameter = {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult'
        };
        const parameters = helpers.toValue(parameter);

        const request = {
            endpoint,
            instances,
            parameters,
        };

        const [response] = await predictionServiceClient.predict(request);
        const predictions = response.predictions;
        if (predictions.length === 0) {
            console.log('No image was generated. Check the request parameters and prompt.');
        } else {
            for (const prediction of predictions) {
                const buff = Buffer.from(
                    prediction.structValue.fields.bytesBase64Encoded.stringValue,
                    'base64'
                );
                // **Resize Image to Max 512x512**
                const resizedBuffer = await sharp(buff)
                    .resize({ width: 512, height: 512, fit: 'inside' })
                    .toBuffer();

                return resizedBuffer;
            }
        }
    } catch (error) {
        console.error("Error generating an image:", error.message);
    }
}

module.exports = {
    generateImage
};