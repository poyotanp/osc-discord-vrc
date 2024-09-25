import { Client as DiscordClient, IntentsBitField } from "discord.js";
import { Client as OSCClient, Message } from "node-osc";
import config from "./config.json";

const allowedUserIds = config.allowedUsers;

const discordClient = new DiscordClient({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.MessageContent
    ]
});

discordClient.on("ready", () => {
    console.log(`[Discord] Logined as ${discordClient.user!.username}`)
})

const oscClient = new OSCClient("127.0.0.1", config.oscPort);

let typingTimeoutId: Timer | undefined = undefined;
let isTyping = false;

discordClient.on("typingStart", (event) => {
    if(!allowedUserIds.includes(event.user.id)) return;
    clearTimeout(typingTimeoutId);
    typingTimeoutId = setTimeout(() => {
        isTyping = false;
    }, 10000);
    isTyping = true;
});

discordClient.on("messageCreate", (event) => {
    if(!event.member || !allowedUserIds.includes(event.member?.id)) return;
    if(event.channelId != config.channelId) return;
    isTyping = false;
    oscClient.send(new Message("/chatbox/input", event.content, true, true));
    console.log(`[Send] ${event.content}`);
});

//Send Typing
setInterval(() => {
    oscClient.send(new Message("/chatbox/typing", isTyping));
}, 1000);

discordClient.login(config.discordToken);