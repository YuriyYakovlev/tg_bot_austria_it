const ffmpeg = require("fluent-ffmpeg");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");

async function generateVideoAsBuffer(imageBuffer, audioFilePath, word = null) {
  return new Promise((resolve, reject) => {
    const imageTempFile = tmp.tmpNameSync({ postfix: ".jpg" });
    const step1OutputFile = tmp.tmpNameSync({ postfix: ".mp4" }); // Video with podcast audio
    const step2OutputFile = tmp.tmpNameSync({ postfix: ".mp4" }); // Video + Text overlay
    const mergedAudioFile = tmp.tmpNameSync({ postfix: ".mp3" }); // Temporary merged audio file

    const animationFile = path.join(__dirname, "news_50.mp4");
    const backgroundMusicFile = path.join(__dirname, "cyberpank-5min-stereo.mp3");
    const tempBackgroundMusicFile = path.join(__dirname, "cyberpank-trimmed-stereo.mp3");

    fs.writeFileSync(imageTempFile, imageBuffer);

    ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
      if (err) {
        console.error("Error getting audio file duration:", err);
        cleanup();
        return reject(err);
      }

      const audioDuration = metadata.format.duration;

      // **STEP 1: Trim the background music to match the podcast's duration**
      ffmpeg()
        .input(backgroundMusicFile)
        .output(tempBackgroundMusicFile)
        .outputOptions([
          "-c:a libmp3lame",
          "-ar", "44100",
          "-ac", "2",
          `-t ${audioDuration}`,
        ])
        .on("end", () => {
          //console.log('Background music trimmed successfully!');

          // **STEP 2: Merge the two audio files into one (Main Audio + Background)**
          ffmpeg()
            .input(audioFilePath)
            .input(tempBackgroundMusicFile)
            .output(mergedAudioFile)
            .outputOptions([
              "-c:a libmp3lame",
              "-ar", "44100",
              "-ac", "2",
              "-filter_complex", `
                [0:a]volume=0.9[audio1];
                [1:a]volume=0.08[audio2];
                [audio1][audio2]amix=inputs=2:duration=first:dropout_transition=0:weights=1 0.08[a]`,
              "-map", "[a]"
            ])
            .on("end", () => {
              //console.log("Step 2: Audio files merged successfully.");
              // **STEP 3: Merge Image, Animation, and Merged Audio into Video**
              ffmpeg()
                .input(imageTempFile)
                .loop()
                .input(mergedAudioFile)
                .input(animationFile)
                .outputOptions([
                  "-c:v libx264",
                  "-tune stillimage",
                  "-pix_fmt yuv420p",
                  "-r 10", 
                  "-shortest",
                  `-filter_complex`,
                  `[0:v]scale=512:512[scaled_image];[scaled_image][2:v]overlay=(W-w)/2:H-h[v]`,
                  "-map", "[v]",
                  "-map", "1:a",
                  "-c:a", "copy",
                ])
                .on("end", () => {
                  //console.log("Step 3: Video + audio merged successfully.");
                  // **STEP 4: Add Text Overlay (if needed)**
                  if (word) {
                    const titleFilePath = path.join(__dirname, "drawTitleText.txt");
                    const subtitleFilePath = path.join(__dirname, "drawSubtitleText.txt");

                    const titleFontPath = path.join(__dirname, "Roboto_Condensed-SemiBold.ttf");
                    const subtitleFontPath = path.join(__dirname, "Roboto_Condensed-Italic.ttf");

                    const lines = word.split("\n");
                    if (lines.length > 1) {
                      fs.writeFileSync(titleFilePath, lines[0]);
                      fs.writeFileSync(subtitleFilePath, lines[1]);
                    } else {
                      fs.writeFileSync(titleFilePath, word);
                    }

                    ffmpeg()
                      .input(step1OutputFile)
                      .outputOptions([
                        "-c:v libx264",
                        "-pix_fmt yuv420p",
                        lines.length > 1
                          ? `-vf drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-25)',drawtext='textfile=${subtitleFilePath}:fontfile=${subtitleFontPath}:fontcolor=black:fontsize=16:x=(w-text_w)/2:y=(h-text_h-6)'`
                          : `-vf drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-15)'`,
                      ])
                      .on("end", () => {
                        console.log("Step 4: Text overlay added successfully.");
                        fs.readFile(step2OutputFile, (err, data) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          cleanup(); // Clean up after everything is done
                          resolve(data);
                        });
                      })
                      .on("error", (err) => {
                        console.error("Error adding text overlay:", err);
                        reject(err);
                      })
                      .save(step2OutputFile);
                  } else {
                    fs.readFile(step1OutputFile, (err, data) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      cleanup(); // Clean up after everything is done
                      resolve(data);
                    });
                  }
                })
                .on("error", (err) => {
                  console.error("Error merging image, audio, and animation:", err);
                  reject(err);
                })
                .save(step1OutputFile);
            })
            .on("error", (err) => {
              console.error("Error merging audio files:", err);
              reject(err);
            })
            .save(mergedAudioFile);

        })
        .on("error", (err) => {
          console.error("Error trimming background music:", err);
          reject(err);
        })
        .run();
    });

    // Cleanup function to delete temporary files
    function cleanup() {
      try {
        fs.unlinkSync(imageTempFile);
        fs.unlinkSync(step1OutputFile);
        fs.unlinkSync(step2OutputFile);
        fs.unlinkSync(mergedAudioFile);
        fs.unlinkSync(tempBackgroundMusicFile);
        console.log("Temporary files cleaned up.");
      } catch (err) {
        console.error("Error cleaning up temporary files:", err);
      }
    }
  });
}

module.exports = {
  generateVideoAsBuffer,
};
