const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    db.addLiveFeed('Server Settings Change', newGuild.name);
    db.addSecurityEvent('SERVER_UPDATE', newGuild.name, `Server configurations updated.`);

    const changes = [];
    if (oldGuild.name !== newGuild.name) {
      changes.push(`• **Name:** \`${oldGuild.name}\` ➔ \`${newGuild.name}\``);
    }
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
      changes.push(`• **Verification Level:** \`${oldGuild.verificationLevel}\` ➔ \`${newGuild.verificationLevel}\``);
    }
    if (oldGuild.icon !== newGuild.icon) {
      changes.push(`• **Server Icon Changed**`);
    }

    if (changes.length === 0) return;

    let updater = 'Unknown';
    let executor = null;

    try {
      const botMe = newGuild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await newGuild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.GuildUpdate
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

    const logDetails = `• **Guild:** \`${newGuild.name}\`\n${changes.join('\n')}\n• **Updated By:** \`${updater}\``;
    
    // Route to #admin-logs
    await logger.log(newGuild, 'Server Settings Updated', logDetails, 'admin-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(newGuild, 'securityEvents', `📁 **Server Settings Updated:** by \`${updater}\`\n${changes.join('\n')}`);

    // Threat alerts for name or verification level modification
    const alertMsg = `Server configurations modified by **${updater}**.\n${changes.join('\n')}`;
    db.addThreat('Server Settings Modified', 'MEDIUM', alertMsg);
    await logger.log(newGuild, '⚠️ SECURITY ALERT', `• **Incident:** Server Settings Modified\n• **Updated By:** **${updater}**\n• **Risk Rating:** \`MEDIUM\`\n\n${changes.join('\n')}`, 'threat-alerts');

    if (executor) {
      const data = db.getDb();
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(newGuild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** updated server settings.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(newGuild, 'BOT_SERVER_UPDATE', `Bot **${executor.tag}** updated server settings.`, 'bot-watchdog');
        await socManager.sendToThread(newGuild, 'botActivity', `🤖 Bot **${executor.tag}** updated server settings`);
      } else {
        await logger.log(newGuild, 'ADMIN_SERVER_UPDATE', `Admin/User **${executor.tag}** updated server settings.`, 'admin-logs');
        await socManager.sendToThread(newGuild, 'adminActivity', `🛡️ Admin **${executor.tag}** updated server settings`);
      }
    }
  },
};
