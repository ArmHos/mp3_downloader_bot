import express from "express";
import TelegramBot from "node-telegram-bot-api";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import path from "path";
import { downloadMP3 } from "./converter.js";
import { downloadMp3AndWriteTags } from "./downloader.js";
import { modifyMetadata } from "./test.js";
import { log } from "console";
import { fstat } from "fs";

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
            limit: 10,
            pages: 1,
            safeSearch: true
        });
        // const secondResultBatch = await ytsr.continueReq(filter.continuation);
        const items = filter.items.sort((a, b) => b.views - a.views).filter((item) => {
            if (item.duration) {
                return parseDurationIntoSec(item.duration) < 600
            }
        });
        console.log(JSON.stringify(items,undefined,20));
        return items;
    } catch (err) {
        throw new Error(err);
    }
};

function parseDurationIntoSec(duration) {
    const dur = duration.split(":");
    return dur.length === 3 ? ((dur[0] ? Number(dur[0]) * 3600 : 0) + (dur[1] ? Number(dur[1]) * 60 : 0) + (dur[2] ? Number(dur[2]) : 0)) : dur.length === 2 ? ((dur[0] ? Number(dur[0]) * 60 : 0) + (dur[1] ? Number(dur[1]) : 0)) : (dur[0] ? Number(dur[0]) : 0);
}

const sendMusicButtons = async (title) => {
    try {
        const items = await searchMP3(title);
        const inline_keyboard = [];

        items.forEach((item) => {
            inline_keyboard.push([{
                text: `${item.duration} | ${item.title}`, callback_data: `${item.url}`
            }])
        });

        return {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    ...inline_keyboard,
                    [{
                        text: `Prev`, callback_data: `-1`
                    },
                    {
                        text: `Next`, callback_data: `1`
                    }]
                ]
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

async function getInfoFromURL(url) {
    try {
        const videoInfo = await ytdl.getInfo(url);
        return {
            options: {
                title: audioName(videoInfo.videoDetails.title),
                filename: audioName(videoInfo.videoDetails.title),
                performer: videoInfo.videoDetails.author.name,
                duration: videoInfo.videoDetails.lengthSeconds,
                contentType: "audio/m4a"
            },
            outputPath: path.resolve("music", `${sanitizeFileName(videoInfo.videoDetails.title)}.m4a`)
        }
    } catch (err) {
        console.error(err);
    }
}
const downloadMusic = async (url, chatID) => {
    try {
        const { options, outputPath } = await getInfoFromURL(url);
        const result = await modifyMetadata(url, outputPath, options.title, options.performer);
        if (result === 0 || result === 101) {
            await bot.sendAudio(chatID, outputPath, options);
        } else {
            console.error(`Conversion failed with code ${result}`);
        }
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
        await bot.sendMessage(chatID, `<i>Results for</i>:\n<b>${msg.text}</b>`, { parse_mode: "HTML", ...options });
    }
});

bot.on("callback_query", async (msg) => {
    if (isNaN(msg.data)) {
        await bot.sendChatAction(msg.message.chat.id, 'record_audio');
        await downloadMusic(msg.data, msg.message.chat.id);  
    } else {
        console.log(msg.data);
    }
});

bot.onText(/\/start/, async (msg) => {
    return await bot.sendMessage(msg.chat.id, "Welcome to MP3 Downloader.");
});