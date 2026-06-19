const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const securityEngine = require('../utils/securityEngine');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const { guild, user } = ban;
    if (!guild) return;

    db.addLiveFeed('User Banned', user.tag);
    db.addSecurityEvent('USER_BAN', user.tag, `Banned from the server.`);

    let modTag = 'System';
    let banReason = 'No reason provided';
    let executor = null;

    try {
      const botMe = guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberBanAdd,
        });
        const banLog = fetchedLogs.entries.first();
        if (banLog && banLog.target.id === user.id && Date.now() - banLog.createdAt.getTime() < 8000) {
          executor = banLog.executor;
          modTag = executor ? executor.tag : 'System';
          banReason = banLog.reason || 'No reason provided';
        }
      }
    } catch (err) {
      // Ignore
    }

    db.addModerationLog('BAN', user.tag, modTag, banReason);
    
    const logDetails = `• **User:** ${user.tag} (${user.toString()})\n• **Moderator:** \`${modTag}\`\n• **Reason:** \`${banReason}\``;
    
    // Route to #admin-logs
    await logger.log(guild, 'Member Banned', logDetails, 'admin-logs');

    // Thread logging: Admin Activity
    await socManager.sendToThread(guild, 'adminActivity', `🛡️ **Member Banned:** ${user.tag} by \`${modTag}\` (Reason: \`${banReason}\`)`);

    if (executor) {
      const data = db.getDb();
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** banned user ${user.tag}.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(guild, 'BOT_BAN_ACTION', `Bot **${executor.tag}** banned user ${user.tag}.`, 'bot-watchdog');
        await socManager.sendToThread(guild, 'botActivity', `🤖 Bot **${executor.tag}** banned user ${user.tag}`);
      }
    }

    // Rate Limit Check: 5+ members banned in 60s
    const triggered = securityEngine.trackRateLimit(guild.id, 'memberBan', 5, 60000);
    if (triggered) {
      const alertMsg = `Mass Ban: 5+ members banned within 60s by **${modTag}**.`;
      db.addThreat('Mass Ban Detected', 'CRITICAL', alertMsg);
      db.addSecurityEvent('MASS_BAN_ALERT', modTag, 'Rate limit exceeded for bans.');
      
      await logger.log(guild, '⚠️ THREAT ALERT', `• **Threat:** Mass Ban\n• **Risk Rating:** \`CRITICAL\`\n• **Details:** ${alertMsg}`, 'threat-alerts');
      await socManager.sendToThread(guild, 'threatAnalysis', `🚨 **MASS BAN DETECTED**\nExecutor: **${modTag}**\nRisk Rating: \`CRITICAL\``);
    }
  },
};
