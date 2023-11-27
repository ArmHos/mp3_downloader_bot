import { spawn } from "child_process";
import fs from "fs";
import ytdl from "ytdl-core";
import ffmpegPath from "ffmpeg-static";

fs.chmodSync(ffmpegPath, '755');
export async function downloadMP3(url, outputPath, artist, title) {
    try {
        if (fs.existsSync(outputPath)) {
            return 101;
        }

        const audioStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', format: "m4a" });
        const ffmpegProcess = spawn(ffmpegPath, [
            '-i', 'pipe:0',
            '-c:a', 'aac',
            '-vn',
            '-acodec', 'libmp3lame',
            '-metadata', `artist=${artist}`,
            '-metadata', `title=${title}`,
            outputPath,
        ]);

        audioStream.pipe(ffmpegProcess.stdin);

        ffmpegProcess.on('error', (err) => {
            console.error('FFmpeg process error:', err);
        });

        await new Promise((resolve, reject) => {
            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Conversion finished!');
                    resolve(code);
                } else {
                    reject(`Conversion failed with code ${code}`);
                }
            });
        });

        return 0;
    } catch (error) {
        console.error('Error during conversion:', error);
        return -1;
    }
}