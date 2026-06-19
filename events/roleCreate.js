const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    if (!role.guild) return;

    db.addLiveFeed('Role Created', `@${role.name}`);
    db.addSecurityEvent('ROLE_CREATE', `@${role.name}`, `Role was created.`);

    let creator = 'Unknown';
    let executor = null;

    try {
      const botMe = role.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await role.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.RoleCreate
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

    const logDetails = `• **Role:** ${role.toString()} (\`${role.name}\`)\n• **ID:** \`${role.id}\`\n• **Created By:** \`${creator}\``;
    
    // Route to #security-logs
    await logger.log(role.guild, 'Role Created', logDetails, 'security-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(role.guild, 'securityEvents', `🎭 **Role Created:** ${role.toString()} (\`${role.name}\`) by \`${creator}\``);

    if (executor) {
      const data = db.getDb();
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(role.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** created role ${role.toString()}.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(role.guild, 'BOT_ROLE_CREATION', `Bot **${executor.tag}** created role ${role.toString()}.`, 'bot-watchdog');
        await socManager.sendToThread(role.guild, 'botActivity', `🤖 Bot **${executor.tag}** created role ${role.toString()}`);
      } else {
        await logger.log(role.guild, 'ADMIN_ROLE_CREATION', `Admin/User **${executor.tag}** created role ${role.toString()}.`, 'admin-logs');
        await socManager.sendToThread(role.guild, 'adminActivity', `🛡️ Admin **${executor.tag}** created role ${role.toString()}`);
      }
    }

    // Rate Limit Check: 3+ roles created in 60s
    const triggered = securityEngine.trackRateLimit(role.guild.id, 'roleCreate', 3, 60000);
    if (triggered) {
      const alertMsg = `Mass Role Creation: 3+ roles created within 60s by **${creator}**.`;
      db.addThreat('Mass Role Creation', 'HIGH', alertMsg);
      db.addSecurityEvent('MASS_ROLE_CREATE_ALERT', creator, 'Rate limit exceeded for role creation.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid role creations.');
      
      await logger.log(role.guild, '⚠️ THREAT ALERT', `• **Threat:** Mass Role Creation\n• **Risk Rating:** \`HIGH\`\n• **Details:** ${alertMsg}`, 'threat-alerts');
      await socManager.sendToThread(role.guild, 'threatAnalysis', `🚨 **MASS ROLE CREATION DETECTED**\nExecutor: **${creator}**\nRisk Rating: \`HIGH\``);
    }
  },
};
