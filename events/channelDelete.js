const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;

    db.addLiveFeed('Channel Deleted', `#${channel.name}`);
    db.addSecurityEvent('CHANNEL_DELETE', `#${channel.name}`, `Channel was deleted.`);

    let deletor = 'Unknown';
    let executor = null;

    try {
      const botMe = channel.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.ChannelDelete
        });
        const logEntry = fetchedLogs.entries.first();
        if (logEntry && Date.now() - logEntry.createdAt.getTime() < 10000) {
          executor = logEntry.executor;
          if (executor) {
            deletor = executor.tag;
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    const logDetails = `• **Channel Name:** \`#${channel.name}\`\n• **ID:** \`${channel.id}\`\n• **Deleted By:** \`${deletor}\``;
    
    // Route to #security-logs
    await logger.log(channel.guild, 'Channel Deleted', logDetails, 'security-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(channel.guild, 'securityEvents', `📁 **Channel Deleted:** \`#${channel.name}\` (\`${channel.id}\`) by \`${deletor}\``);

    // Protected channel check
    const data = db.getDb();
    const isProtected = data.soc?.protectedChannels?.includes(channel.id) || data.soc?.protectedChannels?.includes(channel.name);
    if (isProtected) {
      const alertMsg = `Protected channel **#${channel.name}** was deleted by **${deletor}**.`;
      db.addThreat('Protected Channel Deleted', 'CRITICAL', alertMsg);
      await logger.log(channel.guild, '⚠️ CRITICAL ALERT', `• **Incident:** Protected Channel Deleted\n• **Channel:** \`#${channel.name}\`\n• **Deleted By:** **${deletor}**\n• **Risk Rating:** \`CRITICAL\``, 'threat-alerts');
      await socManager.sendToThread(channel.guild, 'threatAnalysis', `🚨 **CRITICAL: PROTECTED CHANNEL DELETED**\nChannel: \`#${channel.name}\`\nExecutor: **${deletor}**`);
    }

    if (executor) {
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(channel.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** deleted channel \`#${channel.name}\`.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(channel.guild, 'BOT_CHANNEL_DELETION', `Bot **${executor.tag}** deleted channel \`#${channel.name}\`.`, 'bot-watchdog');
        await socManager.sendToThread(channel.guild, 'botActivity', `🤖 Bot **${executor.tag}** deleted channel \`#${channel.name}\``);
      } else {
        await logger.log(channel.guild, 'ADMIN_CHANNEL_DELETION', `Admin/User **${executor.tag}** deleted channel \`#${channel.name}\`.`, 'admin-logs');
        await socManager.sendToThread(channel.guild, 'adminActivity', `🛡️ Admin **${executor.tag}** deleted channel \`#${channel.name}\``);
      }
    }

    // Rate Limit Check: 3+ channels deleted in 60s
    const triggered = securityEngine.trackRateLimit(channel.guild.id, 'channelDelete', 3, 60000);
    if (triggered) {
      const alertMsg = `Mass Channel Deletion: 3+ channels deleted within 60s by **${deletor}**.`;
      db.addThreat('Mass Channel Deletion', 'CRITICAL', alertMsg);
      db.addSecurityEvent('MASS_CHANNEL_DELETE_ALERT', deletor, 'Rate limit exceeded for channel deletion.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid channel deletions.');
      
      await logger.log(channel.guild, '⚠️ THREAT ALERT', `• **Threat:** Mass Channel Deletion\n• **Risk Rating:** \`CRITICAL\`\n• **Details:** ${alertMsg}`, 'threat-alerts');
      await socManager.sendToThread(channel.guild, 'threatAnalysis', `🚨 **MASS CHANNEL DELETION DETECTED**\nExecutor: **${deletor}**\nRisk Rating: \`CRITICAL\``);
    }
  },
};
