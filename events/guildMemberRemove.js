const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const securityEngine = require('../utils/securityEngine');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    if (!member.guild) return;

    db.incrementLeaves();
    db.addLiveFeed('Member Left', member.user.tag);

    let isKick = false;
    let executor = null;
    let kickReason = 'No reason provided';

    try {
      const botMe = member.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await member.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberKick,
        });
        const kickLog = fetchedLogs.entries.first();
        if (kickLog && Date.now() - kickLog.createdAt.getTime() < 8000) {
          if (kickLog.target.id === member.id) {
            isKick = true;
            executor = kickLog.executor;
            kickReason = kickLog.reason || 'No reason provided';
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    if (member.user.bot) {
      const logDetails = `• **Bot:** ${member.user.tag} (${member.toString()})\n• **ID:** \`${member.id}\`\n• **Status:** Removed / Left`;
      await logger.log(member.guild, 'Bot Removed', logDetails, 'bot-watchdog');
      await socManager.sendToThread(member.guild, 'botActivity', `🤖 **Bot Removed:** ${member.user.tag} (\`${member.id}\`)`);
      return;
    }

    if (isKick) {
      const modTag = executor ? executor.tag : 'System';
      db.addModerationLog('KICK', member.user.tag, modTag, kickReason);
      db.addSecurityEvent('MEMBER_KICK', member.user.tag, `Kicked by ${modTag}.`);

      const logDetails = `• **User:** ${member.user.tag} (${member.toString()})\n• **Moderator:** \`${modTag}\`\n• **Reason:** \`${kickReason}\``;
      await logger.log(member.guild, 'Member Kicked', logDetails, 'admin-logs');
      await socManager.sendToThread(member.guild, 'adminActivity', `🛡️ **Member Kicked:** ${member.user.tag} by \`${modTag}\` (Reason: \`${kickReason}\`)`);

      if (executor) {
        const data = db.getDb();
        const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
        if (isWatched) {
          await logger.log(member.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** kicked member ${member.user.tag}.`, 'security-logs');
        }
      }

      // Kicks Rate Limiting: 5+ members kicked in 60s
      const triggered = securityEngine.trackRateLimit(member.guild.id, 'memberKick', 5, 60000);
      if (triggered) {
        const alertMsg = `Mass Kick: 5+ members kicked within 60s by **${modTag}**.`;
        db.addThreat('Mass Kick Detected', 'CRITICAL', alertMsg);
        
        await logger.log(member.guild, '⚠️ THREAT ALERT', `• **Threat:** Mass Kick\n• **Risk Rating:** \`CRITICAL\`\n• **Details:** ${alertMsg}`, 'threat-alerts');
        await socManager.sendToThread(member.guild, 'threatAnalysis', `🚨 **MASS KICK DETECTED**\nExecutor: **${modTag}**\nRisk Rating: \`CRITICAL\``);
      }
    } else {
      await logger.log(member.guild, 'Member Left', `• **User:** ${member.user.tag} (${member.toString()})\n• **ID:** \`${member.id}\``, 'security-logs');
      await socManager.sendToThread(member.guild, 'securityEvents', `👥 **Member Left:** ${member.user.tag} (\`${member.id}\`)`);
    }
  },
};
