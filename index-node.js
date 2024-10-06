//必要なライブラリを読み込み
const { Client: DiscordClient, IntentsBitField } = require("discord.js");
const { Client: OSCClient, Message } = require("node-osc");
const config = require("./config.json");

//許可されたユーザー一覧（Discord）
const allowedUserIds = new Set(config.allowedUsers);

let typingTimeoutId;
let isTyping = false;

//OSCクライアントを初期化
const oscClient = new OSCClient("127.0.0.1", config.oscPort);

//Discordクライアントの初期化
const discordClient = new DiscordClient({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.MessageContent
    ]
});

discordClient.on("ready", () => {
    console.log(`[Discord] Logined as ${discordClient.user.username}`)
})

//Discordでタイピングを開始した時のイベント
discordClient.on("typingStart", (event) => {
    if(!allowedUserIds.includes(event.user.id)) return;
    
    //追加でイベントが発生しなければ、10秒後にタイピングを解除
    clearTimeout(typingTimeoutId);
    typingTimeoutId = setTimeout(() => {
        isTyping = false;
    }, 10000);
    
    isTyping = true;
});

//Discordにメッセージを送信した時のイベント
discordClient.on("messageCreate", (event) => {
    if(!event.member || !allowedUserIds.includes(event.member?.id)) return;
    if(event.channelId != config.channelId) return;
    isTyping = false;
    //VRChatに送信
    oscClient.send(new Message("/chatbox/input", event.content, true, true));
    console.log(`[Send] ${event.content}`);
});

//Typingの状態を送信
setInterval(() => {
    oscClient.send(new Message("/chatbox/typing", isTyping));
}, 1000);

//Discordにログイン
discordClient.login(config.discordToken);
