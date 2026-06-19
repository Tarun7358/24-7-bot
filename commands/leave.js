const fs = require('fs');
const path = require('path');
const { getVoiceConnection } = require('@discordjs/voice');
const config = require('../config');

module.exports = {
  name: 'leave',
  description: 'Make the bot leave the voice channel and disable 24/7 auto-join',
  async execute(message, args, client) {
    try {
      const connection = getVoiceConnection(message.guild.id);

      if (!connection) {
        return message.reply({ content: 'I am not in a voice channel!' });
      }

      // Destroy the voice connection
      connection.destroy();

      // Clear the config value in-memory
      config.voiceChannelId = '';

      // Clear the VOICE_CHANNEL_ID in the .env file programmatically
      try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('VOICE_CHANNEL_ID=')) {
            envContent = envContent.replace(/VOICE_CHANNEL_ID=.*/, 'VOICE_CHANNEL_ID=');
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (err) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ERROR] Failed to clear VOICE_CHANNEL_ID in .env: ${err.message}`);
      }

      await message.reply({ content: '👋 Left the voice channel and cleared auto-join configuration!' });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in leave command: ${err.message}`);
      await message.reply({ content: 'An error occurred while trying to leave the voice channel.' });
    }
  },
};
