const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const config = require('../config');
const db = require('../utils/db');
const logger = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const member = newState.member || oldState.member;
    if (!member) return;
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    // 1. Check if the state update is for this bot
    if (member.id === client.user.id) {
      if (oldState.channelId && !newState.channelId) {
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
          }, 5000);
        }
      }
      return;
    }

    // 2. Track Activity & Session durations for statistics
    if (!oldState.channelId && newState.channelId) {
      // User Joined Voice
      if (!member.user.bot) {
        db.startVoiceSession(member.id);
        logger.log(guild, '🎙️ VOICE JOIN', `• **User:** ${member.user.tag} (${member.toString()})\n• **Channel:** ${newState.channel.toString()}`);
      }
    } else if (oldState.channelId && !newState.channelId) {
      // User Left Voice
      if (!member.user.bot) {
        db.endVoiceSession(member.id);
        logger.log(guild, '🎙️ VOICE LEAVE', `• **User:** ${member.user.tag} (${member.toString()})\n• **Channel:** ${oldState.channel.toString()}`);
      }
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      // User Switched Channel
      if (!member.user.bot) {
        logger.log(guild, '🎙️ VOICE SWITCH', `• **User:** ${member.user.tag} (${member.toString()})\n• **Old Channel:** ${oldState.channel.toString()}\n• **New Channel:** ${newState.channel.toString()}`);
      }
    }

    // 3. Auto-Disconnect / Empty Voice channel checking
    const botConnection = getVoiceConnection(guild.id);
    if (botConnection) {
      const botChannelId = botConnection.joinConfig.channelId;
      const botChannel = guild.channels.cache.get(botChannelId);
      if (botChannel) {
        const humanMembers = botChannel.members.filter(m => !m.user.bot).size;
        if (humanMembers === 0) {
          if (!botChannel.emptyTimeout) {
            botChannel.emptyTimeout = setTimeout(() => {
              const currentHumans = botChannel.members.filter(m => !m.user.bot).size;
              if (currentHumans === 0) {
                botConnection.destroy();
                logger.log(guild, '🔊 VOICE AUTO-DISCONNECT', `• **Details:** Disconnected from ${botChannel.toString()} because the channel is empty.`);
                if (client.musicQueues && client.musicQueues.has(guild.id)) {
                  client.musicQueues.delete(guild.id);
                }
              }
              botChannel.emptyTimeout = null;
            }, 15000);
          }
        } else {
          if (botChannel.emptyTimeout) {
            clearTimeout(botChannel.emptyTimeout);
            botChannel.emptyTimeout = null;
          }
        }
      }
    }
  },
};
