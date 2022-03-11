import {createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import {Client} from 'discord.js';
import {config} from 'dotenv';
import fetch from 'node-fetch';

config();

const client = new Client({intents: ['GUILDS', 'GUILD_VOICE_STATES'], presence: {
  status: 'idle',
  activities: [{
    name: 'radio',
    type: 'STREAMING',
    url: process.env.URL,
  }]
}});

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
		maxMissedFrames: 250,
	},
});

client.login(process.env.TOKEN);

client.once('ready', async ()=>{
  console.log('Bot is online');
  const guild = client.guilds.cache.get(process.env.GUILD_ID) || client.guilds.cache.first();
  if (!guild) {
    console.error('No guilds found');
    process.exit(1);
  }

  const channel = process.env.CHANNEL_ID ? await guild.channels.fetch(process.env.CHANNEL_ID) : guild.channels.cache.find((channel)=>channel.isVoice())
  if (!channel || !channel.isVoice()) {
    console.error('No VCs found in guild', guild.name, 'or incorrect channel type');
    process.exit(1);
  }
  const vc = joinVoiceChannel({
    adapterCreator: guild.voiceAdapterCreator,
    channelId: channel.id,
    guildId: guild.id,
  });
  try {
		await entersState(vc, VoiceConnectionStatus.Ready, 30_000);
    const subscription = vc.subscribe(player);
    subscription.player.play(createAudioResource((await fetch(process.env.URL)).body));
	} catch (error) {
		vc.destroy();
    console.error('Error occurred with joining vc.')
		process.exit(1);
	}
});