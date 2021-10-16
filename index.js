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
    const voiceChannel = message.member.voice.channel;
    const messageText = message.content.toLowerCase();
    
    console.log(client.voice)
    console.log(client.voice.connections)

    if(messageText === '?join') {
        if (voiceChannel) { 
            if (!client.voice.connections.some(conn => conn.channel.id == voiceChannel.id)) {
                const connection = await voiceChannel.join()
            } else {
                let m = await message.reply("Already connected to the voice channel.");
                m.delete({ timeout: 5000 })
            }
        } else {
            let m = await message.reply("You need to be in a voice channel!")
            m.delete({ timeout: 5000 })
        }
    }

    if(messageText === '?leave') {
        if (client.voice.connections.size > 0) {
            messageChannel.leave();
        } else {
            let m = await message.reply("Not in any voice channel.")
            m.delete({ timeout: 5000 })
        }
    }
})
