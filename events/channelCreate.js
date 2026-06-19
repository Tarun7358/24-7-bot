const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;

    db.addLiveFeed('Channel Created', `#${channel.name}`);
    db.addSecurityEvent('CHANNEL_CREATE', `#${channel.name}`, `Channel was created.`);

    let creator = 'Unknown';
    let executor = null;

    try {
      const botMe = channel.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.ChannelCreate
        });
        const logEntry = fetchedLogs.entries.first();
        if (logEntry && Date.now() - logEntry.createdAt.getTime() < 10000) {
          executor = logEntry.executor;
          if (executor) {
            creator = executor.tag;
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    const logDetails = `• **Channel:** ${channel.toString()} (\`${channel.name}\`)\n• **ID:** \`${channel.id}\`\n• **Created By:** \`${creator}\``;
    
    // Route to #security-logs
    await logger.log(channel.guild, 'Channel Created', logDetails, 'security-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(channel.guild, 'securityEvents', `📁 **Channel Created:** ${channel.toString()} (\`${channel.name}\`) by \`${creator}\``);

    if (executor) {
      const data = db.getDb();
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(channel.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** created channel ${channel.toString()}.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(channel.guild, 'BOT_CHANNEL_CREATION', `Bot **${executor.tag}** created channel ${channel.toString()}.`, 'bot-watchdog');
        await socManager.sendToThread(channel.guild, 'botActivity', `🤖 Bot **${executor.tag}** created channel ${channel.toString()}`);
      } else {
        await logger.log(channel.guild, 'ADMIN_CHANNEL_CREATION', `Admin/User **${executor.tag}** created channel ${channel.toString()}.`, 'admin-logs');
        await socManager.sendToThread(channel.guild, 'adminActivity', `🛡️ Admin **${executor.tag}** created channel ${channel.toString()}`);
      }
    }

    // Rate Limit Check: 3+ channels created in 60s
    const triggered = securityEngine.trackRateLimit(channel.guild.id, 'channelCreate', 3, 60000);
    if (triggered) {
      const alertMsg = `Mass Channel Creation: 3+ channels created within 60s by **${creator}**.`;
      db.addThreat('Mass Channel Creation', 'HIGH', alertMsg);
      db.addSecurityEvent('MASS_CHANNEL_CREATE_ALERT', creator, 'Rate limit exceeded for channel creation.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid channel creations.');
      
      await logger.log(channel.guild, '⚠️ THREAT ALERT', `• **Threat:** Mass Channel Creation\n• **Risk Rating:** \`HIGH\`\n• **Details:** ${alertMsg}`, 'threat-alerts');
      await socManager.sendToThread(channel.guild, 'threatAnalysis', `🚨 **MASS CHANNEL CREATION DETECTED**\nExecutor: **${creator}**\nRisk Rating: \`HIGH\``);
    }
  },
};
