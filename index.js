require('dotenv').config()

const { Client, Intents, Channel } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const client = new Client({ intents: 641 });
const prefix = "?";
isReady = false;

const queue = new Map();

/*
const queueConstruct = {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    search: [],
    volume: 5,
    playing: true,
    leaveTimer: null /* 20 seconds in question 
  };
  */
  //queue.set('1234567812345678', queueContruct);
  
  // 2. get queueContruct from queue
  //const serverQueue = queue.get('1234567812345678');
  //if(!serverQueue) { /* not exist */ }
  
  // 3. delete from queue
  //queue.delete('1234567812345678');

client.login(process.env.BOT_TOKEN);

client.on("ready", () => {
    isReady = true;
    console.log("Bot is ready");
})



client.on("message", async message => {
    if (!isReady) return;
    if (message.author.bot) return;

    let voiceChannel = message.member.voice.channel;
    let messageText = message.content.toLowerCase();

    if(messageText.startsWith('${prefix}join')) voiceChannelJoin(message, voiceChannel);

    if(messageText.startsWith('${prefix}leave')) voiceChannelLeave(message);

    if(messageText.startsWith('${prefix}play')) executePlayCommand(message, voiceChannel);

})


function voiceChannelJoin(message, voiceChannel) {
    if (!voiceChannel) return message.reply("You need to be in a voice channel.");
        
    if (client.voice.connections) return message.reply("Already connected to a voice channel.");

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator:voiceChannel.guild.voiceAdapterCreator,
    });

            
    const queueConstruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: connection,
        songs: [],
        search: [],
        volume: 5,
        playing: false
      };

    queue.set(message.guild.id, queueConstruct);
    message.channel.send('Joined ' + voiceChannel.name + ' channel. Use ' + prefix + 'play to add songs to the queue.')

}

function voiceChannelLeave(message) {
    let connection = queue.get(message.guild.id).connection;

    if (!connection) return message.reply("Not in any voice channel.");

    connection.disconnect();
    connection.destroy();

    queue.get(message.guild.id).connection = null;
}

function executePlayCommand(message, voiceChannel) {
    const messageChannel = message.channel;
    const audioName = message.content.split(' ')[1]; // "audioName"

    if (!voiceChannel) return message.reply("You need to be in a voice channel.");

    if (!queue.get(message.guild.id)) voiceChannelJoin(message, voiceChannel);

    messageChannel.send('Added ' + audioName + ' to the queue.');
    
}

