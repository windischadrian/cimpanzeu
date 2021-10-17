require('dotenv').config()

const { Client, Intents, Channel } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const client = new Client({ intents: 641 });
const ytdl = require('ytdl-core');
// const ytsr = require('ytsr');
const ytsr = require('youtube-search-without-api-key');
const prefix = '?';
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
    
    if(messageText.startsWith(`${prefix}join`)) voiceChannelJoin(message, voiceChannel);

    if(messageText.startsWith(`${prefix}leave`)) voiceChannelLeave(message);

    if(messageText.startsWith(`${prefix}play`)) executePlayCommand(message, voiceChannel);

    if(messageText.startsWith(`${prefix}skip`)) executeSkipCommand(message);

    if(messageText.startsWith(`${prefix}stop`)) executeStopCommand(message);

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
    message.channel.send(`Joined ${voiceChannel.name} channel. Use **${prefix}play** to add songs to the queue.`)

}

function voiceChannelLeave(message) {
    let connection = queue.get(message.guild.id).connection;

    if (!connection) return message.reply("Not in any voice channel.");

    connection.disconnect();
    connection.destroy();

    queue.delete(message.guild.id);
}

async function executePlayCommand(message, voiceChannel) {
    const messageChannel = message.channel;
    const audioName = message.content.substr(`${prefix}play`.length); // "audioName"

    if (!voiceChannel) return message.reply("You need to be in a voice channel.");

    if (!audioName) return message.reply("Forgot song title?");

    var serverQueue = queue.get(message.guild.id);
    if (!serverQueue) {
        voiceChannelJoin(message, voiceChannel);
        serverQueue = queue.get(message.guild.id)
    }

    try {
        var audioUrl = audioName;
        if (!audioUrl.match(/(youtube.com|watch?v=)/)) {
            audioUrl = await searchYoutubeAsync(audioName);
        }
        const songInfo = await ytdl.getInfo(audioUrl);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        }
        
        serverQueue.songs.push(song);

        if (!serverQueue.playing) play(message);

        messageChannel.send(`Added **${song.title}** to the queue.`);
    } catch (err) {
        console.log(err);
        return messageChannel.send(`Encountered an error: ${err}`);
    }
    
}

async function searchYoutubeAsync(songName) {
    // var videoInfo = await ytsr(songName, { limit: 1});
    const videoResult = await ytsr.search(songName);
    const videoUrl = videoResult[0].url;
    return videoUrl;
}

function play(message) {
    const guildId = message.guild.id;
    const serverQueue = queue.get(guildId);
    const song = serverQueue.songs[0];
    console.log('connection: ' + serverQueue.connection);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guildId);
        return;
    }

    const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
        serverQueue.songs.shift();
        play(message);
    })
        .on("error", error => console.error(error));

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Playing: **${song.title}**`);

}

function executeSkipCommand(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!message.member.voice.channel) return message.reply("You need to be in a voice channel.");

    if (!serverQueue) return message.reply("No songs currently playing.");

    message.reply("Skipped current song.");
    serverQueue.songs.shift();
    play(message)
}

function executeStopCommand(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!message.member.voice.channel) return message.reply("You need to be in a voice channel.");

    if (!serverQueue) return message.reply("No songs currently playing.");

    message.reply("Stopped playing songs.");
    serverQueue.connection.dispatcher.end();
    queue.delete(message.guild.id);
}
