import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";
import ffmpegPath from "ffmpeg-static";

fs.chmodSync(ffmpegPath, '755');

export async function downloadMP3(url, outputPath, artist, title) {
    const res = fs.existsSync(outputPath);
    if (res) {
        return 101;
    } else {
        const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', format: "m4a" })
        const ffmpeg = spawn(ffmpegPath, [
            '-i', 'pipe:0',
            '-vn',
            '-acodec',
            'libmp3lame',
            '-metadata', `artist=${artist}`,
            '-metadata', `title=${title}`,
            outputPath,
        ]);

        await stream.pipe(ffmpeg.stdin);

        ffmpeg.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        const code = await new Promise((resolve, reject) => {
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('Conversion finished!');
                    resolve(code);
                } else {
                    reject(`Conversion failed with code ${code}`);
                }
            });
        });
        return code;
    }
}