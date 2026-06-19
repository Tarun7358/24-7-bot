const { joinVoiceChannel } = require('@discordjs/voice');
const config = require('../config');

module.exports = {
  name: 'voiceStateUpdate',
  execute(oldState, newState, client) {
    // Check if the state update is for this bot
    if (oldState.member.id === client.user.id) {
      // If the bot was previously in a channel, but now it isn't (disconnected)
      if (oldState.channelId && !newState.channelId) {
        // Only trigger if a 24/7 channel is configured and it matches the disconnected channel
        if (config.voiceChannelId && oldState.channelId === config.voiceChannelId) {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] [WARN] Bot was disconnected from 24/7 Voice Channel. Reconnecting in 5 seconds...`);
          
          setTimeout(async () => {
            try {
              const channel = client.channels.cache.get(config.voiceChannelId) || await client.channels.fetch(config.voiceChannelId);
              if (channel && channel.isVoiceBased()) {
                joinVoiceChannel({
                  channelId: channel.id,
                  guildId: channel.guild.id,
                  adapterCreator: channel.guild.voiceAdapterCreator,
                  selfDeafen: true,
                  selfMute: false
                });
                console.log(`[${timestamp}] [INFO] Successfully reconnected to 24/7 Voice Channel: ${channel.name}`);
              }
            } catch (err) {
              console.log(`[${timestamp}] [ERROR] Failed to reconnect to 24/7 Voice Channel: ${err.message}`);
            }
          }, 5000); // 5-second buffer to handle gateway handshakes
        }
      }
    }
  },
};
