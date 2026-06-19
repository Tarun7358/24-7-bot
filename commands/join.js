const fs = require('fs');
const path = require('path');
const { joinVoiceChannel } = require('@discordjs/voice');
const config = require('../config');

module.exports = {
  name: 'join',
  description: 'Make the bot join your current voice channel and set it for 24/7 presence',
  
  async execute(message, args, client) {
    try {
      const voiceChannel = message.member.voice.channel;

      if (!voiceChannel) {
        return message.reply({ content: 'You must be in a voice channel first!' });
      }

      const permissions = voiceChannel.permissionsFor(client.user);
      if (!permissions.has('Connect')) {
        return message.reply({ content: 'I do not have permission to join your voice channel.' });
      }

      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeafen: true,
        selfMute: false
      });

      config.voiceChannelId = voiceChannel.id;

      try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('VOICE_CHANNEL_ID=')) {
            envContent = envContent.replace(/VOICE_CHANNEL_ID=.*/, `VOICE_CHANNEL_ID=${voiceChannel.id}`);
          } else {
            envContent += `\nVOICE_CHANNEL_ID=${voiceChannel.id}`;
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (err) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ERROR] Failed to save VOICE_CHANNEL_ID to .env: ${err.message}`);
      }

      await message.reply({ 
        content: `🔊 Joined **${voiceChannel.name}** and configured it as your 24/7 channel (saved to configuration)!` 
      });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in join command: ${err.message}`);
      await message.reply({ content: 'An error occurred while trying to join the voice channel.' });
    }
  },

  slashData: {
    name: 'join',
    description: 'Make the bot join your current voice channel and set it for 24/7 presence'
  },

  async executeSlash(interaction, client) {
    try {
      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({ content: 'You must be in a voice channel first!', ephemeral: true });
      }

      const permissions = voiceChannel.permissionsFor(client.user);
      if (!permissions.has('Connect')) {
        return interaction.reply({ content: 'I do not have permission to join your voice channel.', ephemeral: true });
      }

      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeafen: true,
        selfMute: false
      });

      config.voiceChannelId = voiceChannel.id;

      try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('VOICE_CHANNEL_ID=')) {
            envContent = envContent.replace(/VOICE_CHANNEL_ID=.*/, `VOICE_CHANNEL_ID=${voiceChannel.id}`);
          } else {
            envContent += `\nVOICE_CHANNEL_ID=${voiceChannel.id}`;
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (err) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ERROR] Failed to save VOICE_CHANNEL_ID to .env: ${err.message}`);
      }

      await interaction.reply({ 
        content: `🔊 Joined **${voiceChannel.name}** and configured it as your 24/7 channel (saved to configuration)!` 
      });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in join slash command: ${err.message}`);
      await interaction.reply({ content: 'An error occurred while trying to join the voice channel.', ephemeral: true });
    }
  }
};
