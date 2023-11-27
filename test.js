// import fs from "fs";
// import { exec } from "child_process";
// import ytdl from "ytdl-core";
// import path from "path";
// import { log } from "console";

// const videoUrl = 'https://www.youtube.com/watch?v=qoggUgMPpC8';
// const outputFilePath = path.resolve("output.m4a");

// const newTitle = 'Your New Title';

// const stream = ytdl(videoUrl, { filter: 'audioonly' });

// const command = `ffmpeg -i pipe:0 -c copy -metadata title="${newTitle}" -metadata artist="Yeahhh" -f mp4 ${outputFilePath}`;

// const ffmpegProcess = exec(command, (error, stdout, stderr) => {
//     if (error) {
//         console.error('Error:', error.message);
//         return;
//     }
//     if (stderr) {
//         console.error('stderr:', stderr);
//         return;
//     }
//     console.log('Metadata updated and file saved successfully.');
// });

// stream.pipe(ffmpegProcess.stdin);

// ffmpegProcess.on('exit', () => {
//     console.log('FFmpeg process ended.');
// });

import fs from 'fs';
import { spawn } from 'child_process';
import ytdl from 'ytdl-core';
import path from 'path';

function executeFFmpeg(stream, outputFilePath, title, artist) {
    console.log(`title:${title} :: artist:${artist}`);
    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn('ffmpeg', [
            '-i', 'pipe:0',
            '-c', 'copy',
            '-metadata', `title=${title}`,
            '-metadata', `artist=${artist}`,
            '-f', 'mp4',
            outputFilePath
        ]);
        stream.pipe(ffmpegProcess.stdin);

        ffmpegProcess.on('exit', () => {
            console.log('FFmpeg process ended.');
            resolve('Metadata updated and file saved successfully.');
        });

        ffmpegProcess.on('error', (err) => {
            console.error('FFmpeg process error:', err);
            reject(err);
        });
    });
}

// function executeFFmpeg(stream, outputFilePath, title, artist, coverImagePath) {
//     return new Promise((resolve, reject) => {
//         const ffmpegProcess = spawn('ffmpeg', [
//             '-i', 'pipe:0', // Input audio from pipe
//             '-i', '/home/armen/Desktop/musical-note.png ', // Input cover image
//             // '-c:a', 'aac', // Re-encode audio to AAC
//             // '-b:a', '256k', // AAC bitrate (adjust as needed)
//             '-map', '0:a', // Map audio from input 0
//             '-map', '1:v', // Map video (cover image) from input 1
//             '-metadata', `title=${title}`,
//             '-metadata', `artist=${artist}`,
//             '-metadata:s:v', 'title="Album cover"',
//             '-metadata:s:v', 'comment="Cover (Front)"',
//             '-disposition:V:1', 'attached_pic', // Set cover image as attached picture
//             outputFilePath
//         ]);

//         stream.pipe(ffmpegProcess.stdin);

//         ffmpegProcess.on('exit', () => {
//             console.log('FFmpeg process ended.');
//             resolve('Metadata updated and file saved successfully.');
//         });

//         ffmpegProcess.on('error', (err) => {
//             console.error('FFmpeg process error:', err);
//             reject(err);
//         });
//     });
// }

export async function modifyMetadata(videoUrl, outputFilePath, title, artist) {
    try {
        if (fs.existsSync(outputFilePath)) {
            return 101;
        } else {
            const stream = ytdl(videoUrl, { filter: 'audioonly' });
            const result = await executeFFmpeg(stream, outputFilePath, title, artist);
            console.log(result);
            return 0;
        }
    } catch (error) {
        console.error('Error during metadata modification:', error.message);
        return error;
    }
}