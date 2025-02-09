const ffmpeg = require("fluent-ffmpeg");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");

async function generateVideoAsBuffer(imageBuffer, audioFilePath, word = null) {
  return new Promise((resolve, reject) => {
    // Temporary file paths
    const imageTempFile = tmp.tmpNameSync({ postfix: ".jpg" });
    const videoOutputFile = tmp.tmpNameSync({ postfix: ".mp4" }); // Video with podcast audio (final output if no text overlay)
    const videoWithTextFile = tmp.tmpNameSync({ postfix: ".mp4" }); // Video with text overlay

    // Files from your project folder
    const animationFile = path.join(__dirname, "news_50.mp4");

    // Write the image buffer to a temporary image file
    fs.writeFileSync(imageTempFile, imageBuffer);

    // STEP 1: Merge Image, Podcast Audio, and Animation into Video
    ffmpeg()
      .input(imageTempFile)      // Input: still image
      .loop()                    // Loop the image to create a video track
      .input(audioFilePath)      // Input: podcast audio
      .input(animationFile)      // Input: animation overlay
      .output(videoOutputFile)
      .outputOptions([
        "-c:v libx264",         // Encode video using H.264
        "-tune stillimage",     // Optimize for still image (less motion)
        "-pix_fmt yuv420p",     // Use widely compatible pixel format
        "-r 10",                // Set frame rate (lower frame rate reduces file size)
        "-shortest",            // End output when the shortest input (podcast audio) ends
        "-filter_complex", `[0:v]scale=512:512[scaled_image];[scaled_image][2:v]overlay=(W-w)/2:H-h[v]`,
        "-map", "[v]",          // Map the filtered video output
        "-map", "1:a",          // Map the podcast audio
        "-c:a", "copy"          // Copy the audio stream without re-encoding
      ])
      .on("end", () => {
        //console.log("Step 1: Video + audio merged successfully.");

        // STEP 2: (Optional) Add Text Overlay if a word is provided
        if (word) {
          const titleFilePath = path.join(__dirname, "drawTitleText.txt");
          const subtitleFilePath = path.join(__dirname, "drawSubtitleText.txt");
          const titleFontPath = path.join(__dirname, "Roboto_Condensed-SemiBold.ttf");
          const subtitleFontPath = path.join(__dirname, "Roboto_Condensed-Italic.ttf");

          const lines = word.split("\n");
          if (lines.length > 1) {
            fs.writeFileSync(titleFilePath, cleanupText(lines[0]), { encoding: 'utf8' });
            fs.writeFileSync(subtitleFilePath, cleanupText(lines[1]), { encoding: 'utf8' });
          } else {
            fs.writeFileSync(titleFilePath, word);
          }

          ffmpeg()
            .input(videoOutputFile)
            .output(videoWithTextFile)
            .outputOptions([
              "-c:v libx264",
              "-pix_fmt yuv420p",
              lines.length > 1
                ? `-vf drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-25)',drawtext='textfile=${subtitleFilePath}:fontfile=${subtitleFontPath}:fontcolor=black:fontsize=14:x=(w-text_w)/2:y=(h-text_h-6)'`
                : `-vf drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-15)'`
            ])
            .on("end", () => {
              //console.log("Step 2: Text overlay added successfully.");
              fs.readFile(videoWithTextFile, (err, data) => {
                cleanup(); // Remove temporary files
                if (err) {
                  return reject(err);
                }
                resolve(data);
              });
            })
            .on("error", (err) => {
              console.error("Error adding text overlay:", err);
              cleanup();
              reject(err);
            })
            .run();
        } else {
          fs.readFile(videoOutputFile, (err, data) => {
            cleanup(); // Remove temporary files
            if (err) {
              return reject(err);
            }
            resolve(data);
          });
        }
      })
      .on("error", (err) => {
        console.error("Error merging image, audio, and animation:", err);
        cleanup();
        reject(err);
      })
      .run();

    // Cleanup function to remove temporary files except the final one
    function cleanup() {
      try {
        fs.unlinkSync(imageTempFile);
        fs.unlinkSync(videoOutputFile);
        fs.unlinkSync(videoWithTextFile);
      } catch (err) {
        console.error("Error cleaning up temporary files:", err);
      }
    }
  });
}

function cleanupText(text) {
  let cleaned = text;//.replace(/[^\w\s.,;:!?'-]/g, '');
  cleaned = text.replace(/([\u2700-\u27BF]|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}])/gu, '');

  // if (cleaned.length > 100) {
  //   cleaned = cleaned.substring(0, 100).trim();
  // }
  return cleaned;
}

module.exports = {
  generateVideoAsBuffer,
};
