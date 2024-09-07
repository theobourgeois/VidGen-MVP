const fs = require("fs");
const express = require("express");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
require("dotenv").config(".env");

const app = express();

app.use(cors());
app.use(express.json());

function escape(text) {
    return text
        .replaceAll("\\", "\\\\\\\\\\\\\\\\")
        .replaceAll("'", "\\\\\\'")
        .replaceAll("%", "\\\\\\\\\\%")
        .replaceAll(":", "\\\\\\\\\\\\:");
}
function getBaseFootageFromVideoLength(
    videoLength,
    audioBase64,
    alignment,
    callback,
    wordsPerCaption = 1
) {
    const videoPath = "video.mp4";
    const outputPath = "output.mp4";
    const finalOutputPath = "final_output.mp4";

    // Decode Base64 audio and save to a temporary file
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioPath = `temp_audio.mp3`;
    fs.writeFileSync(audioPath, audioBuffer);

    // Create caption segments
    const words = alignment.characters.join("").split(" ");
    const startTimes = alignment.character_start_times_seconds;
    const captions = [];
    let currentCaption = "";
    let currentEndIndex = 0;

    for (let i = 0; i < words.length; i += wordsPerCaption) {
        currentCaption = words.slice(i, i + wordsPerCaption).join(" ");
        const start = startTimes[currentEndIndex];
        let end;

        let spaceCount = 0;
        for (let j = currentEndIndex; j < startTimes.length; j++) {
            if (alignment.characters[j] === " ") {
                spaceCount++;
            }

            if (spaceCount === wordsPerCaption || j === startTimes.length - 1) {
                end = startTimes[j];
                currentEndIndex = j + 1;
                break;
            }
        }
        captions.push({
            text: currentCaption,
            start,
            end,
        });
    }

    const pathToHelveticaBold = "Helvetica-Bold.ttf";
    const maxCharsPerLine = 17;
    const drawtextFilters = captions
        .map((caption) => {
            let text = caption.text;
            let lines = [];

            // Split text into multiple lines
            while (text.length > maxCharsPerLine) {
                let line = text.slice(0, maxCharsPerLine);
                let lastSpaceIndex = line.lastIndexOf(" ");
                if (lastSpaceIndex > -1) {
                    line = line.slice(0, lastSpaceIndex);
                    text = text.slice(lastSpaceIndex + 1);
                } else {
                    text = text.slice(maxCharsPerLine);
                }
                lines.push(line);
            }
            lines.push(text); // Add the remaining text
            console.log(lines);

            // Generate drawtext filters for each line
            return lines
                .map((line, index) => {
                    return `drawtext=text='${escape(
                        line
                    )}':fontfile=${pathToHelveticaBold}:fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2+${
                        50 + index * 50
                    }:box=1:boxcolor=black@0.8:enable='between(t,${
                        caption.start
                    },${caption.end})'`;
                })
                .join(",");
        })
        .join(",");

    // Get video duration
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
            return callback(err);
        }
        const videoDuration = metadata.format.duration;
        const maxStartTime = videoDuration - videoLength;
        const startTime = Math.random() * maxStartTime;

        // Cut the video, crop to 9:16 aspect ratio, add captions, and mute the original audio
        ffmpeg(videoPath)
            .setStartTime(startTime)
            .setDuration(videoLength)
            .videoFilters(
                `crop=ih*9/16:ih,${drawtextFilters}` // Crop to 9:16 aspect ratio and add captions
            )
            .outputOptions("-an") // Mute the original audio
            .output(outputPath)
            .on("end", () => {
                // Add new audio to the muted video
                ffmpeg(outputPath)
                    .addInput(audioPath)
                    .outputOptions("-c:v copy") // Copy the video codec to avoid re-encoding
                    .output(finalOutputPath)
                    .on("end", () => {
                        // Clean up temporary audio file
                        fs.unlinkSync(audioPath);
                        callback(null, finalOutputPath);
                    })
                    .on("error", (err) => {
                        fs.unlinkSync(audioPath);
                        callback(err);
                    })
                    .run();
            })
            .on("error", (err) => {
                fs.unlinkSync(audioPath);
                callback(err);
            })
            .run();
    });
}

app.post("/makevideo", async (req, res) => {
    const { text, voiceId, apiKey, wordsPerCaption } = req.body;
    try {
        console.log(voiceId);
        const data = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );
        const result = await data.json();
        const audioBase64 = result.audio_base64; // Assuming the API returns an audio Base64 string
        const alignment = result.alignment; // Assuming the API returns alignment data

        const videoLength = alignment.character_end_times_seconds.reduce(
            (acc, val) => Math.max(acc, val),
            0
        );

        getBaseFootageFromVideoLength(
            videoLength,
            audioBase64,
            alignment,
            (err, outputPath) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }

                // Read the final video file and convert to Base64
                fs.readFile(outputPath, (err, data) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    const base64Video = data.toString("base64");
                    const base64Url = `data:video/mp4;base64,${base64Video}`;
                    res.json({ base64Url });
                });
            },
            wordsPerCaption
        );
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
