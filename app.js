import express from "express";
import TelegramBot from "node-telegram-bot-api";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import path from "path";
import { downloadMP3 } from "./converter.js";

const app = express();
const port = process.env.PORT || 5005;

const token = process.env.TEL_TOKEN;

app.get("/", (req, res) => {
    res.send("OK");
});

app.listen(port, () => {
    console.log(`Server is listening on port::${port}`);
});

const searchMP3 = async (title) => {
    try {
        const filter = await ytsr(title, {
            pages: 1
        });
        const items = filter.items.sort((a, b) => b.views - a.views);
        return items;
    } catch (err) {
        throw new Error(err);
    }
};

const sendMusicButtons = async (title) => {
    try {
        const items = await searchMP3(title);
        const inline_keyboard = [];

        items.forEach((item) => {
            if (item.duration) {
                inline_keyboard.push([{ text: `${item.duration} | ${item.title}`, callback_data: `${item.url}` }])
            }
        });

        return {
            reply_markup: JSON.stringify({
                inline_keyboard
            })
        }
    } catch (err) {
        throw new Error(err);
    }
};

function sanitizeFileName(videoTitle) {
    return videoTitle.replace(/[\\/:"*?<>|]/g, '');
}

function audioName(name) {
    return name.replace((/[\/:*?"<>|\\]/g, "_"));
}

const downloadMusic = async (url, chatID) => {
    try {
        const videoInfo = await ytdl.getInfo(url);
        const videoTitle = sanitizeFileName(videoInfo.videoDetails.title);
        const audiofileName = audioName(videoInfo.videoDetails.title);
        const artist = videoInfo.videoDetails.author.name;
        const duration = videoInfo.videoDetails.lengthSeconds;
        const outputPath = path.resolve("music", `${audiofileName}.mp3`);
        const sendOptions = {
            title: videoTitle,
            filename: videoTitle,
            duration,
            contentType: "audio/mpeg"
        };
        console.time();
        const result = await downloadMP3(url, outputPath, artist, videoTitle);
        if (result === 0 || result === 101) {
            await bot.sendAudio(chatID, outputPath, {}, sendOptions);
        } else {
            console.error(`Conversion failed with code ${result}`);
        }
        console.timeEnd();
    } catch (err) {
        throw new Error(err);
    }
};

const bot = new TelegramBot(token, {
    polling: true
});

bot.on("message", async (msg) => {
    if (!msg.text.includes("/")) {
        const chatID = msg.chat.id;
        const options = await sendMusicButtons(msg.text);
        await bot.sendMessage(chatID, `Results for ${msg.text}`, options);
    }
});

bot.on("callback_query", async (msg) => {
    await bot.sendChatAction(msg.message.chat.id, 'record_audio');
    await downloadMusic(msg.data, msg.message.chat.id);
});

bot.onText(/\/start/, async (msg) => {
    return await bot.sendMessage(msg.chat.id, "Welcome to MP3 Downloader.");
});