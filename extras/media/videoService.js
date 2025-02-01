// videoService.js
const ffmpeg = require("fluent-ffmpeg");
const tmp = require('tmp'); 
const fs = require('fs');


//async function generateVideoAsBuffer(imageBuffer, audioFilePath, srt) {
async function generateVideoAsBuffer(imageBuffer, audioFilePath, word = null) {
  return new Promise((resolve, reject) => {
    const imageTempFile = tmp.tmpNameSync({ postfix: '.jpg' });
    const audioTempFile = audioFilePath;
    //const srtTempFile = tmp.tmpNameSync({ postfix: '.srt' });
    fs.writeFileSync(imageTempFile, imageBuffer);
    //fs.writeFileSync(srtTempFile, srt);

    const outputTempFile = tmp.tmpNameSync({ postfix: '.mp4' });
    setTimeout(() => {
      const ffmpegProcess = ffmpeg()
        .input(imageTempFile)
        .loop()
        .input(audioTempFile)
        //.input(srtTempFile)
        .outputOptions([
          "-c:v libx264",
          "-tune stillimage",
          "-pix_fmt yuv420p",
          "-shortest",
          // `-vf subtitles='${srtTempFile}:force_style="Fontsize=18,Alignment=2,MarginV=20,PrimaryColour=&H00FFFFFF&,OutlineColour=&H00000000&,BackColour=&H80000000&,BorderStyle=3,Shadow=0"'`, 
        ]);
        if (word && word.trim() !== "") {
            let text = word.replace(/ /g, "_");
            ffmpegProcess.outputOptions([
                `-vf drawtext='text=${text}:fontcolor=white:fontsize=30:x=(w-text_w)/2:y=(h-text_h-40)'`
            ]);
        }
        ffmpegProcess
        .output(outputTempFile)
        .format("mp4")  
        .on("end", () => {
          fs.readFile(outputTempFile, (err, data) => {
            if (err) {
              fs.unlinkSync(imageTempFile);
              fs.unlinkSync(audioTempFile);
              fs.unlinkSync(outputTempFile);
              //fs.unlinkSync(srtTempFile);
              reject(err);
              return;
            }

            fs.unlinkSync(imageTempFile);
            fs.unlinkSync(audioTempFile);
            fs.unlinkSync(outputTempFile);
            //fs.unlinkSync(srtTempFile);
            
            resolve(data);
            console.log("FFmpeg processing completed successfully");
          });
        })
        .on("error", (err) => {
          console.error('FFmpeg error:', err);
          fs.unlinkSync(imageTempFile);
          fs.unlinkSync(audioTempFile);
          //fs.unlinkSync(srtTempFile);
          reject(err);
        })
        // .on('stderr', (stderr) => {
        //   console.error('FFmpeg stderr:', stderr);
        // })
        // .on('stdout', (stdout) => {
        //   console.log('FFmpeg stdout:', stdout);
        // })
        // .on('start', (commandLine) => {
        //   console.log('FFmpeg process started with command:', commandLine);
        // });
      ffmpegProcess.run();
    }, 2000);

  });
}

module.exports = {
    generateVideoAsBuffer
};