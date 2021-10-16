require('dotenv').config()

const { Client, Intents, Channel } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const client = new Client({ intents: 641 });
const replyTimeout = 100000;
isReady = false;

client.login(process.env.BOT_TOKEN);

client.on("ready", () => {
    isReady = true;
    console.log("Bot is ready");
})



client.on("message", async message => {
    if (!isReady) return;
    if (message.author.bot) return;

    let messageChannel = message.channel;
    let voiceChannel = message.member.voice.channel;
    let messageText = message.content.toLowerCase();

    if(messageText === '?join') voiceChannelJoin(message, voiceChannel);

    if(messageText === '?leave') voiceChannelLeave(message, voiceChannel);

})


function voiceChannelJoin(message, voiceChannel) {
    if (!voiceChannel) return message.reply("You need to be in a voice channel.");
        
    if (client.voice.connections) return message.reply("Already connected to a voice channel.");
        
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator:voiceChannel.guild.voiceAdapterCreator,
    });

}

function voiceChannelLeave(message, voiceChannel) {
    let connection = message.guild.voiceConnection;
    if (!connection) return message.reply("Not in any voice channel.");
    connection.disconnect();
    connection.destroy();
}

