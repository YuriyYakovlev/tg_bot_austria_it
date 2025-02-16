const ffmpeg = require("fluent-ffmpeg");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");

async function generateVideoAsBuffer(imageBuffer, audioFilePath, title, mainText) {
  return new Promise((resolve, reject) => {
    const imageTempFile = tmp.tmpNameSync({ postfix: ".jpg" });
    const step1OutputFile = tmp.tmpNameSync({ postfix: ".mp4" }); // Video with podcast audio
    const step2OutputFile = tmp.tmpNameSync({ postfix: ".mp4" }); // Video + Text overlay
    const mergedAudioFile = tmp.tmpNameSync({ postfix: ".mp3" }); // Temporary merged audio file
    const trimmedAudioFile = tmp.tmpNameSync({ postfix: ".mp3" }); // Trimmed final audio

    const animationFile = path.join(__dirname, "news_50.mp4");
    const backgroundMusicFile = path.join(__dirname, "cyberpank-5min-stereo.mp3");
    const tempBackgroundMusicFile = tmp.tmpNameSync({ postfix: ".mp3" }); // Temporary trimmed background music

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
          //console.log("Step 1: Background music trimmed successfully.");
          // **STEP 2: Merge the two audio files (Main Audio + Background Music)**
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
                [1:a]volume=0.01[audio2];
                [audio1][audio2]amix=inputs=2:duration=first:dropout_transition=0[a]`,
              "-map", "[a]"
            ])
            .on("end", () => {
              //console.log("Step 2: Audio files merged successfully.");
              // **STEP 3: Trim the final merged audio to match the podcast duration**
              ffmpeg()
                .input(mergedAudioFile)
                .output(trimmedAudioFile)
                .outputOptions([
                  "-c:a libmp3lame",
                  "-ar", "44100",
                  "-ac", "2",
                  `-t ${audioDuration}`,
                ])
                .on("end", () => {
                  //console.log("Step 3: Merged audio trimmed to exact duration.", trimmedAudioFile);
                  generateFinalVideo(trimmedAudioFile);
                })
                .on("error", (err) => {
                  console.error("Error trimming final merged audio:", err);
                  reject(err);
                })
                //.save(trimmedAudioFile);
                .run(); 
            })
            .on("error", (err) => {
              console.error("Error merging audio files:", err);
              reject(err);
            })
            //.save(mergedAudioFile);
            .run(); 
        })
        .on("error", (err) => {
          console.error("Error trimming background music:", err);
          reject(err);
        })
        //.run();
        .save(tempBackgroundMusicFile);
    });

    function generateFinalVideo(finalAudioFile) {
      // **STEP 4: Merge Image, Animation, and Trimmed Audio into Video**
      ffmpeg()
        .input(imageTempFile)
        .loop()
        .input(finalAudioFile)
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
          //console.log("Step 4: Video + audio merged successfully.");
          // **STEP 5: Add Text Overlay (if needed)**
          const titleFilePath = path.join(__dirname, "drawTitleText.txt");
          const subtitleFilePath = path.join(__dirname, "drawSubtitleText.txt");
          const titleFontPath = path.join(__dirname, "Roboto_Condensed-SemiBold.ttf");
          const subtitleFontPath = path.join(__dirname, "Roboto_Condensed-Italic.ttf");
          const cyberFontPath = path.join(__dirname, "Tektur-SemiBold.ttf");
            
          const lines = splitTextIntoLines(mainText, 40);
          const lineHeight = 60;
          const totalTextHeight = lines.length * lineHeight;
          const startY = 256 - totalTextHeight;
          
          let mainTextFilters = lines.map((line, index) => {
              const yPos = startY + index * lineHeight;
              const lineFilePath = path.join(__dirname, `text_line_${index}.txt`);
              fs.writeFileSync(lineFilePath, line);
              return `drawtext=textfile=${lineFilePath}:fontfile=${cyberFontPath}:fontcolor=white:fontsize=24:box=1:boxcolor=black@1:boxborderw=10:x=(w-text_w)/2:y=${yPos}`;
          });

          const titleLines = title.split("\n");
          if (titleLines.length > 1) {
            fs.writeFileSync(titleFilePath, titleLines[0]);
            fs.writeFileSync(subtitleFilePath, titleLines[1]);
            mainTextFilters.push(`drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-25)',drawtext='textfile=${subtitleFilePath}:fontfile=${subtitleFontPath}:fontcolor=black:fontsize=16:x=(w-text_w)/2:y=(h-text_h-6)`);
          } else {
            fs.writeFileSync(titleFilePath, title);
            mainTextFilters.push(`drawtext='textfile=${titleFilePath}:fontfile=${titleFontPath}:fontcolor=black:fontsize=20:x=(w-text_w)/2:y=(h-text_h-15)'`);
          }

          ffmpeg()
            .input(step1OutputFile)
            .outputOptions([
              "-c:v libx264",
              "-pix_fmt yuv420p",
              `-vf ${mainTextFilters.join(',')}`,
            ])
            .on("end", () => {
              //console.log("Step 5: Text overlay added successfully.");
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
        })
        .on("error", (err) => {
          console.error("Error merging image, audio, and animation:", err);
          reject(err);
        })
        .save(step1OutputFile);
    }

    // Cleanup function to delete temporary files
    function cleanup() {
      try {
        fs.unlinkSync(imageTempFile);
        fs.unlinkSync(step1OutputFile);
        fs.unlinkSync(step2OutputFile);
        fs.unlinkSync(mergedAudioFile);
        fs.unlinkSync(trimmedAudioFile);
        fs.unlinkSync(tempBackgroundMusicFile);
        //console.log("Temporary files cleaned up.");
      } catch (err) {
        console.error("Error cleaning up temporary files:", err);
      }
    }
  });
}

function splitTextIntoLines(text, maxLength) {
  text = text.replace(/([\u2700-\u27BF]|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}])/gu, '');
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';
  
  words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
          currentLine += (currentLine ? ' ' : '') + word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  });
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

module.exports = {
  generateVideoAsBuffer,
};
