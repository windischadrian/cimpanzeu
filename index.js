require('dotenv').config()

const { Client, Intents, Channel, MessageEmbed } = require('discord.js');
const { 
    getVoiceConnection, 
    joinVoiceChannel, 
    createAudioResource,
    createAudioPlayer,
    AudioPlayerStatus,
    NoSubscriberBehavior
} = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const playdl = require('play-dl');
// const ytsr = require('ytsr');
const ytsr = require('youtube-search-without-api-key');
const prefix = '?';
isready = false;

const queue = new Map();

/*
const queueConstruct = {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    musicStream: createAudioPlayer(),
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

    if(messageText.startsWith(`${prefix}q`)) executeQueueueueCommand(message);

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
        musicStream: createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        }),
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
    audioName = message.content.substr(`${prefix}play`.length).trim();

    if (!voiceChannel) return message.reply("You need to be in a voice channel.");

    if (!audioName) return message.reply("Forgot song title?");

    var serverQueue = queue.get(message.guild.id);
    if (!serverQueue) {
        voiceChannelJoin(message, voiceChannel);
        serverQueue = queue.get(message.guild.id)
    }

    try {
        var songInfo;
        if (!audioName.includes('www.youtube.com/watch?v=')) {
            songInfo = await searchYoutubeAsync(audioName);
        } else {
            songInfo = {
                title: 'Plm e d-aia cu link',
                url: audioName,
                duration: '00:00'
            }
        }
 
        const song = {
            title: songInfo.title,
            url: songInfo.url,
            duration: songInfo.duration_raw,
        }
        
        serverQueue.songs.push(song);

        if (!serverQueue.playing) play(message);

        messageChannel.send(`Added **${song.title}** to the queue.\n${song.url}`);
    } catch (err) {
        console.log(err);
        return messageChannel.send(`Shit went sideways\n${err}`);
    }
    
}

async function searchYoutubeAsync(songName) {
    // var videoInfo = await ytsr(songName, { limit: 1});
    const videoResult = await ytsr.search(songName);
    const songInfo = videoResult[0];
    console.log(songInfo);
    return songInfo;
}

async function play(message) {
    const messageChannel = message.channel;
    const guildId = message.guild.id;
    const serverQueue = queue.get(guildId);
    const song = serverQueue.songs[0];

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guildId);
        return;
    }

    try {
        console.log('song url: ' + song.url)
        const stream = await playdl.stream(song.url);
        let resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })

        serverQueue.musicStream.play(resource);

        serverQueue.connection.subscribe(serverQueue.musicStream);
        serverQueue.playing = true;

        serverQueue.textChannel.send(`Playing: **${song.title}**`);

        serverQueue.musicStream.on(AudioPlayerStatus.Idle, () => {
            serverQueue.playing = false;
            serverQueue.songs.shift();
            play(message)
        });

    } catch (err) {
        console.log(err);
        return messageChannel.send(`Shit went sideways\n${err}`);
    }
    
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

function executeQueueueueCommand(message) {
    try {
        const serverQueue = queue.get(message.guild.id);

        if (!serverQueue) message.channel.reply('Not playing any songs or some shit.');
    
        var qMessage = '*Songs in queueueueueueue:\n';
        var i = 1;
        serverQueue.songs.forEach(song => {
            qMessage+= i + ' - ' + song.title + ' - ' + song.duration + '\n';
            i++;
        });
        qMessage+='*';
        message.channel.send(qMessage);
    } catch (err) {
        message.reply(`Shit went sideways\n${err}`);
    }
    
}