// videoService.js
const ffmpeg = require("fluent-ffmpeg");
const tmp = require('tmp'); 
const fs = require('fs');
const path = require('path');



async function generateVideoAsBuffer(imageBuffer, audioFilePath, word = null) {
    return new Promise((resolve, reject) => {
      const imageTempFile = tmp.tmpNameSync({ postfix: '.jpg' });
      const audioTempFile = audioFilePath;
      const outputTempFile = tmp.tmpNameSync({ postfix: '.mp4' });
      const finalOutputFile = tmp.tmpNameSync({ postfix: '.mp4' });
      const animationFile = path.join(__dirname, 'news_50.mp4');
      fs.writeFileSync(imageTempFile, imageBuffer);

      ffmpeg()
        .input(imageTempFile)
        .loop()
        .input(audioTempFile)
        .input(animationFile)
        .outputOptions([
          "-c:v libx264",
          "-tune stillimage",
          "-pix_fmt yuv420p",
          "-shortest",
          `-filter_complex`,
          `[0:v]scale=512:512[scaled_image];[scaled_image][2:v]overlay=(W-w)/2:H-h[v]`,
          "-map", "[v]",
          "-map", "1:a",
          "-c:a", "copy",
        ])
        .on("end", () => {
          //console.log("Image, audio, and animation merged successfully.");
          if (word) {
            // if word consists of two lines, save them to separate files
            const titleFilePath = path.join(__dirname, 'drawTitleText.txt');
            const subtitleFilePath = path.join(__dirname, 'drawSubtitleText.txt');

            const titleFontPath = path.join(__dirname, 'Roboto_Condensed-SemiBold.ttf');
            const subtitleFontPath = path.join(__dirname, 'Roboto_Condensed-Italic.ttf');

            const lines = word.split('\n');
            if (lines.length > 1) {
              const line1 = lines[0];
              const line2 = lines[1];
              fs.writeFileSync(titleFilePath, line1);
              fs.writeFileSync(subtitleFilePath, line2);
            } else {
              fs.writeFileSync(titleFilePath, word);
            }

            ffmpeg()
              .input(outputTempFile)
              .outputOptions([
                "-c:v libx264",
                "-pix_fmt yuv420p",
                lines.length > 1 ?
                `-vf drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-25)',drawtext='textfile=${subtitleFilePath}:fontfile=${subtitleFontPath}:fontcolor=black:fontsize=16:x=(w-text_w)/2:y=(h-text_h-6)'` 
                :
                `-vf drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-15)'` 
                ,
              ])
              .on("end", () => {
                //console.log("Text overlay added successfully.");
                fs.readFile(finalOutputFile, (err, data) => {
                  if (err) {
                    fs.unlinkSync(imageTempFile);
                    fs.unlinkSync(audioTempFile);
                    fs.unlinkSync(outputTempFile);
                    fs.unlinkSync(finalOutputFile);
                    reject(err);
                    return;
                  }
                  fs.unlinkSync(imageTempFile);
                  fs.unlinkSync(audioTempFile);
                  fs.unlinkSync(outputTempFile);
                  fs.unlinkSync(finalOutputFile);
      
                  resolve(data);
                  console.log("FFmpeg processing completed successfully");
                });
              })
              .on("error", (err) => {
                console.error('Error adding text overlay:', err);
              })
              .save(finalOutputFile);
          } else {
            fs.readFile(outputTempFile, (err, data) => {
              if (err) {
                fs.unlinkSync(imageTempFile);
                fs.unlinkSync(audioTempFile);
                fs.unlinkSync(outputTempFile);
                reject(err);
                return;
              }

              fs.unlinkSync(imageTempFile);
              fs.unlinkSync(audioTempFile);
              fs.unlinkSync(outputTempFile);
              resolve(data);
            });
          }
        })
        .on("error", (err) => {
          console.error('Error merging image, audio, and animation:', err);
        })
        .save(outputTempFile);
    });
}
  

module.exports = {
    generateVideoAsBuffer
};