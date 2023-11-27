import ytdl from 'ytdl-core';
import fs from "fs";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";

fs.chmodSync(ffmpegPath, '755');
console.time();

export const downloadMp3AndWriteTags = async (url, outputFilePath, artist, videoTitle, thumbnailPath) => {
    const exists = fs.existsSync(outputFilePath);
    if (exists) {
        return 101;
    } else {
        const video = ytdl(url, { quality: 'highestaudio', filter: "audioonly", format: "m4a" });
        const ffmpegProcess = spawn(ffmpegPath, [
            '-i', 'pipe:0',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-metadata', `title=${videoTitle}`,
            '-metadata', `artist=${artist}`,
            // '-metadata', 'album=YourAlbum',
            outputFilePath
        ]);

        await video.pipe(ffmpegProcess.stdin);

        ffmpegProcess.stderr.on('data', (data) => {
            console.error('FFmpeg error:', data.toString());
        });

        const code = await new Promise((res, rej) => {
            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Metadata added successfully!');
                    res(code);
                } else {
                    rej(`Failed to add metadata. :: ${code}`)
                }
            });
        });
        return code;
    }
}