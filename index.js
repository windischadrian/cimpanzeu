require('dotenv').config()

const { Client, Intents, Channel } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

isReady = false;

client.login(process.env.BOT_TOKEN);

client.on("ready", () => {
    isReady = true;
    console.log("Bot is ready");
})



client.on("message", async message => {
    if (!isReady) return;
    if (message.author.bot) return;

    const messageChannel = message.channel;
    const voiceChannel = message.member.guild.voiceChannel;
    const messageText = message.content.toLowerCase();

    if(messageText === '?join') {
        const connection = await message.member.voice.channel.join();
    }

    if(messageText === '?leave') {
        if (client.voice.connections.size > 0) {
            messageChannel.leave();
        } else {
            messageChannel.send("Not in any voice channel.");
        }
    }
})
