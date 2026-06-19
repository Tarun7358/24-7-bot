const { ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const config = require('../config');

module.exports = {
  name: 'ready',
  once: false, // Fires on reconnects to restore presence and VC automatically
  async execute(client) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] Bot is ready! Logged in as ${client.user.tag}`);
    
    try {
      // Set custom activity: Watching "Rage X Corp"
      client.user.setPresence({
        activities: [{ name: 'Rage X Corp', type: ActivityType.Watching }],
        status: 'online',
      });
      console.log(`[${timestamp}] [INFO] Presence set: Watching "Rage X Corp", status: Online`);
    } catch (err) {
      console.log(`[${timestamp}] [ERROR] Failed to set bot presence: ${err.message}`);
    }

    // Register Slash Commands on startup
    try {
      const slashCommands = [];
      client.commands.forEach(command => {
        if (command.slashData) {
          slashCommands.push(command.slashData);
        }
      });

      if (slashCommands.length > 0) {
        await client.application.commands.set(slashCommands);
        console.log(`[${timestamp}] [INFO] Successfully registered ${slashCommands.length} slash commands globally.`);
      }
    } catch (err) {
      console.log(`[${timestamp}] [ERROR] Failed to register slash commands: ${err.message}`);
    }

    // Auto-join the 24/7 Voice Channel if configured
    if (config.voiceChannelId) {
      try {
        const channel = client.channels.cache.get(config.voiceChannelId) || await client.channels.fetch(config.voiceChannelId);
        if (channel && channel.isVoiceBased()) {
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeafen: true, // Optimizes network and CPU/RAM by not receiving audio
            selfMute: false
          });
          console.log(`[${timestamp}] [INFO] Auto-joined 24/7 Voice Channel: ${channel.name} (${channel.id})`);
        } else {
          console.log(`[${timestamp}] [WARN] Voice channel ID ${config.voiceChannelId} not found or is not a voice channel.`);
        }
      } catch (err) {
        console.log(`[${timestamp}] [ERROR] Failed to auto-join voice channel: ${err.message}`);
      }
    }
  },
};
