import { exec } from "child_process";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";
import https from "https";

async function writeMetadata(filePath, imagePath, title, artist) {
    try {
        const command = `kid3-cli -c "set title '${title}'" -c "set artist '${artist}'" -c "set picture:'${imagePath}' 'Front Cover'" "${filePath}"`;

        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });

        process.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            fs.rename(filePath, `/home/armen/Desktop/mp3-downloader-bot/music/${filePath}j.m4a`, (err) => {
                if (err) throw err;
                console.log('Rename complete!');
            });
        });
    } catch (err) {
        throw new Error(err)
    }
}

// async function downloadMP3(url, imageUrl) {
//     try {
//         const now = Date.now();
//         const filePath = `${now}.m4a`;
//         const audioStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', format: "m4a" });
//         audioStream.pipe(fs.createWriteStream(path.resolve("music", filePath)));
//         const imageName = `${now}.jpg`
//         const file = fs.createWriteStream(path.resolve("imgs", `${imageName}`));
//         https.get(imageUrl, response => {
//             response.pipe(file);
//             file.on('finish', () => {
//                 file.close();
//                 console.log(`Image downloaded as ${imageName}`);
//                 writeMetadata(filePath, imageName, "exav", "exavuvv");
//             });
//         }).on('error', err => {
//             fs.unlink(imageName);
//             console.error(`Error downloading image: ${err.message}`);
//         });
//         return now;
//     } catch (err) {
//         throw new Error(err)
//     }
// }

async function downloadMP3(url, imageUrl) {
    try {
        const now = Date.now();
        const filePath = `${now}.m4a`;
        const audioStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio', format: "m4a" });
        audioStream.pipe(fs.createWriteStream(path.resolve("music", filePath)));
        const imageName = `${now}.jpg`
        const file = fs.createWriteStream(path.resolve("imgs", `${imageName}`));
        const response = await new Promise((resolve, reject) => {
            https.get(imageUrl, response => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Image downloaded as ${imageName}`);
                    resolve(response);
                });
            }).on('error', err => {
                fs.unlink(imageName, () => {
                    reject(`Error downloading image: ${err.message}`);
                });
            });
        });

        const metadata = await writeMetadata(filePath, imageName, "exav", "exavuvv");
        return metadata;
    } catch (err) {
        throw new Error(err);
    }
}

// Ensure this code is within an async function
(async () => {
    try {
        const videoUrl = "https://www.youtube.com/watch?v=5Ia2LeebYtc";
        const imageUrl = "https://i.ytimg.com/vi/5Ia2LeebYtc/hq720.jpg?sqp=-oaymwEjCOgCEMoBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLDmdt3FPJqWe9l6LeV7UQlUeCURYA";

        const result = await downloadMP3(videoUrl, imageUrl);
        console.log("Metadata written:", result);
    } catch (error) {
        console.error("Error:", error.message);
    }
})();




// https://www.youtube.com/watch?v=5Ia2LeebYtc
// https://i.ytimg.com/vi/5Ia2LeebYtc/hq720.jpg?sqp=-oaymwEjCOgCEMoBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLDmdt3FPJqWe9l6LeV7UQlUeCURYA
downloadMP3("https://www.youtube.com/watch?v=5Ia2LeebYtc")
