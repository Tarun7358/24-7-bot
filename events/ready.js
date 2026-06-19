const { ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const config = require('../config');
const db = require('../utils/db');
const giveawayHelper = require('../utils/giveawayHelper');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'ready',
  once: false,
  async execute(client) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] Bot is ready! Logged in as ${client.user.tag}`);
    
    try {
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

        client.guilds.cache.forEach(async (guild) => {
          try {
            await guild.commands.set(slashCommands);
            console.log(`[${timestamp}] [INFO] Registered slash commands instantly for server: ${guild.name}`);
          } catch (err) {
            // Ignore
          }
        });
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
            selfDeafen: true,
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

    // 1. Giveaway drawing checker (every 10 seconds)
    setInterval(async () => {
      const data = db.getDb();
      const now = Date.now();
      const activeGiveaways = data.giveaways.filter(g => !g.ended && g.endsAt <= now);
      
      for (const gw of activeGiveaways) {
        try {
          await giveawayHelper.drawGiveaway(client, gw);
        } catch (err) {
          console.error(`[ERROR] drawing giveaway ${gw.messageId}:`, err.message);
        }
      }
    }, 10000);

    // 2. Initialize Operations Center (SOC)
    client.guilds.cache.forEach(async (guild) => {
      try {
        await socManager.initSoc(guild, client);
      } catch (err) {
        console.error(`[SOC] Failed to initialize guild ${guild.name}:`, err.message);
      }
    });

    // 3. Start automated stats category and reports update cycle (every 5 minutes)
    setInterval(() => {
      socManager.runTick(client);
    }, 5 * 60 * 1000);
  },
};
