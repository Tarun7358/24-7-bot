const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    if (!role.guild) return;

    db.addLiveFeed('Role Deleted', `@${role.name}`);
    db.addSecurityEvent('ROLE_DELETE', `@${role.name}`, `Role was deleted.`);

    let deletor = 'Unknown';
    let executor = null;

    try {
      const botMe = role.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await role.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.RoleDelete
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

    const logDetails = `• **Role Name:** \`@${role.name}\`\n• **ID:** \`${role.id}\`\n• **Deleted By:** \`${deletor}\``;
    
    // Route to #security-logs
    await logger.log(role.guild, 'Role Deleted', logDetails, 'security-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(role.guild, 'securityEvents', `🎭 **Role Deleted:** \`@${role.name}\` (\`${role.id}\`) by \`${deletor}\``);

    // Protected role check
    const data = db.getDb();
    const isProtected = data.soc?.protectedRoles?.includes(role.id) || data.soc?.protectedRoles?.includes(role.name);
    if (isProtected) {
      const alertMsg = `Protected role **@${role.name}** was deleted by **${deletor}**.`;
      db.addThreat('Protected Role Deleted', 'CRITICAL', alertMsg);
      await logger.log(role.guild, '⚠️ CRITICAL ALERT', `• **Incident:** Protected Role Deleted\n• **Role:** \`@${role.name}\`\n• **Deleted By:** **${deletor}**\n• **Risk Rating:** \`CRITICAL\``, 'threat-alerts');
      await socManager.sendToThread(role.guild, 'threatAnalysis', `🚨 **CRITICAL: PROTECTED ROLE DELETED**\nRole: \`@${role.name}\`\nExecutor: **${deletor}**`);
    }

    if (executor) {
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(role.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** deleted role \`@${role.name}\`.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(role.guild, 'BOT_ROLE_DELETION', `Bot **${executor.tag}** deleted role \`@${role.name}\`.`, 'bot-watchdog');
        await socManager.sendToThread(role.guild, 'botActivity', `🤖 Bot **${executor.tag}** deleted role \`@${role.name}\``);
      } else {
        await logger.log(role.guild, 'ADMIN_ROLE_DELETION', `Admin/User **${executor.tag}** deleted role \`@${role.name}\`.`, 'admin-logs');
        await socManager.sendToThread(role.guild, 'adminActivity', `🛡️ Admin **${executor.tag}** deleted role \`@${role.name}\``);
      }
    }

    // Rate Limit Check: 3+ roles deleted in 60s
    const triggered = securityEngine.trackRateLimit(role.guild.id, 'roleDelete', 3, 60000);
    if (triggered) {
      const alertMsg = `Mass Role Deletion: 3+ roles deleted within 60s by **${deletor}**.`;
      db.addThreat('Mass Role Deletion', 'CRITICAL', alertMsg);
      db.addSecurityEvent('MASS_ROLE_DELETE_ALERT', deletor, 'Rate limit exceeded for role deletion.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid role deletions.');
      
      await logger.log(role.guild, '⚠️ THREAT ALERT', `• **Threat:** Mass Role Deletion\n• **Risk Rating:** \`CRITICAL\`\n• **Details:** ${alertMsg}`, 'threat-alerts');
      await socManager.sendToThread(role.guild, 'threatAnalysis', `🚨 **MASS ROLE DELETION DETECTED**\nExecutor: **${deletor}**\nRisk Rating: \`CRITICAL\``);
    }
  },
};
