const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel, client) {
    if (!newChannel.guild) return;

    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push(`• **Name:** \`${oldChannel.name}\` ➔ \`${newChannel.name}\``);
    }
    if (oldChannel.topic !== newChannel.topic) {
      changes.push(`• **Topic:** \`${oldChannel.topic || 'None'}\` ➔ \`${newChannel.topic || 'None'}\``);
    }

    if (changes.length === 0) return;

    db.addSecurityEvent('CHANNEL_UPDATE', `#${newChannel.name}`, `Channel updated.`);

    let updater = 'Unknown';
    let executor = null;

    try {
      const botMe = newChannel.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await newChannel.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.ChannelUpdate
        });
        const logEntry = fetchedLogs.entries.first();
        if (logEntry && Date.now() - logEntry.createdAt.getTime() < 10000) {
          executor = logEntry.executor;
          if (executor) {
            updater = executor.tag;
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    const logDetails = `• **Channel:** ${newChannel.toString()}\n${changes.join('\n')}\n• **Updated By:** \`${updater}\``;
    
    // Route to #security-logs
    await logger.log(newChannel.guild, 'Channel Updated', logDetails, 'security-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(newChannel.guild, 'securityEvents', `📁 **Channel Updated:** ${newChannel.toString()} by \`${updater}\`\n${changes.join('\n')}`);

    // Protected channel check
    const data = db.getDb();
    const isProtected = data.soc?.protectedChannels?.includes(newChannel.id) || data.soc?.protectedChannels?.includes(newChannel.name);
    if (isProtected) {
      const alertMsg = `Protected channel **#${newChannel.name}** was updated by **${updater}**.`;
      db.addThreat('Protected Channel Updated', 'MEDIUM', alertMsg);
      await logger.log(newChannel.guild, '⚠️ SECURITY ALERT', `• **Incident:** Protected Channel Updated\n• **Channel:** ${newChannel.toString()}\n• **Updated By:** **${updater}**\n• **Risk Rating:** \`MEDIUM\``, 'threat-alerts');
      await socManager.sendToThread(newChannel.guild, 'threatAnalysis', `🚨 **WARNING: PROTECTED CHANNEL UPDATED**\nChannel: ${newChannel.toString()}\nExecutor: **${updater}**`);
    }

    if (executor) {
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(newChannel.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** updated channel ${newChannel.toString()}.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(newChannel.guild, 'BOT_CHANNEL_UPDATE', `Bot **${executor.tag}** updated channel ${newChannel.toString()}.`, 'bot-watchdog');
        await socManager.sendToThread(newChannel.guild, 'botActivity', `🤖 Bot **${executor.tag}** updated channel ${newChannel.toString()}`);
      } else {
        await logger.log(newChannel.guild, 'ADMIN_CHANNEL_UPDATE', `Admin/User **${executor.tag}** updated channel ${newChannel.toString()}.`, 'admin-logs');
        await socManager.sendToThread(newChannel.guild, 'adminActivity', `🛡️ Admin **${executor.tag}** updated channel ${newChannel.toString()}`);
      }
    }
  }
};
