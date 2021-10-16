require('dotenv').config()

const { Client, Intents, Channel } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
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

    const messageChannel = message.channel;
    const voiceChannel = message.member.voice.channel;
    const messageText = message.content.toLowerCase();
    
    console.log(client.voice)
    console.log(client.voice.connections)
    console.log('message member ' + message.member)
    console.log('voice channel ' + voiceChannel)

    if(messageText === '?join') {
        voiceChannelJoin(message, voiceChannel);
    }

    if(messageText === '?leave') {
       voiceChannelLeave(message, voiceChannel)
    }
})


function voiceChannelJoin(message, voiceChannel) {
    if (voiceChannel) { 
        if (!client.voice.connections) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator:voiceChannel.guild.voiceAdapterCreator,
            });
        } else {
            message.reply("Already connected to a voice channel.").then(msg => {
                setTimeout(() => {
                    msg.delete();
                 }, 100);
              })
        }
    } else {
        message.reply("You need to be in a voice channel!").then(msg => {
            setTimeout(() => {
                msg.delete();
             }, 100);
          })
    }
}

function voiceChannelLeave(message, voiceChannel) {
    if (client.voice.connections) {
        const connection = getVoiceConnection(voiceChannel.guild.id);
        connection.destroy();
    } else {
        message.reply("Not in any voice channel.").then(msg => {
            setTimeout(() => {
                msg.delete();
             }, 100);
          })
    }
}
