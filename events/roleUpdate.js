const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

// List of protected permissions to monitor
const monitoredPerms = [
  { name: 'Administrator', flag: PermissionFlagsBits.Administrator },
  { name: 'Manage Server', flag: PermissionFlagsBits.ManageGuild },
  { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles },
  { name: 'Manage Channels', flag: PermissionFlagsBits.ManageChannels },
  { name: 'Manage Webhooks', flag: PermissionFlagsBits.ManageWebhooks },
  { name: 'Ban Members', flag: PermissionFlagsBits.BanMembers },
  { name: 'Kick Members', flag: PermissionFlagsBits.KickMembers },
  { name: 'Mention Everyone', flag: PermissionFlagsBits.MentionEveryone },
  { name: 'Moderate Members', flag: PermissionFlagsBits.ModerateMembers }
];

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole, client) {
    if (!newRole.guild) return;

    const changes = [];
    let permChanges = [];

    if (oldRole.name !== newRole.name) {
      db.addLiveFeed('Role Updated', `@${oldRole.name} -> @${newRole.name}`);
      changes.push(`• **Name:** \`@${oldRole.name}\` ➔ \`@${newRole.name}\``);
    }

    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push(`• **Permissions Updated**`);
      
      // Analyze monitored permissions added
      for (const p of monitoredPerms) {
        if (newRole.permissions.has(p.flag) && !oldRole.permissions.has(p.flag)) {
          permChanges.push(p.name);
        }
      }
    }

    if (changes.length === 0) return;

    db.addSecurityEvent('ROLE_UPDATE', `@${newRole.name}`, `Role updated.`);

    let updater = 'Unknown';
    let executor = null;

    try {
      const botMe = newRole.guild.members.me;
      if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const fetchedLogs = await newRole.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.RoleUpdate
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

    const logDetails = `• **Role:** ${newRole.toString()}\n${changes.join('\n')}\n• **Updated By:** \`${updater}\``;
    
    // Route to #security-logs
    await logger.log(newRole.guild, 'Role Updated', logDetails, 'security-logs');

    // Thread logging: Security Events
    await socManager.sendToThread(newRole.guild, 'securityEvents', `🎭 **Role Updated:** ${newRole.toString()} by \`${updater}\`\n${changes.join('\n')}`);

    // Check protected role modification
    const data = db.getDb();
    const isProtected = data.soc?.protectedRoles?.includes(newRole.id) || data.soc?.protectedRoles?.includes(newRole.name);
    if (isProtected) {
      const alertMsg = `Protected role **@${newRole.name}** was modified by **${updater}**.`;
      db.addThreat('Protected Role Modified', 'HIGH', alertMsg);
      await logger.log(newRole.guild, '⚠️ HIGH ALERT', `• **Incident:** Protected Role Modified\n• **Role:** ${newRole.toString()}\n• **Updated By:** **${updater}**\n• **Risk Rating:** \`HIGH\``, 'threat-alerts');
      await socManager.sendToThread(newRole.guild, 'threatAnalysis', `🚨 **WARNING: PROTECTED ROLE MODIFIED**\nRole: ${newRole.toString()}\nExecutor: **${updater}**`);
    }

    // Check permission escalations
    if (permChanges.length > 0) {
      const isNewlyAdmin = permChanges.includes('Administrator');
      const rating = isNewlyAdmin ? 'HIGH' : 'MEDIUM';

      for (const perm of permChanges) {
        db.addThreat('Permission Escalation', rating, `Role @${newRole.name} was granted ${perm} by ${updater}.`);
        
        const alertEmbed = [
          `⚠️ **Security Alert**`,
          ``,
          `**Role:**`,
          `@${newRole.name}`,
          ``,
          `**Permission Added:**`,
          `\`${perm}\``,
          ``,
          `**Changed By:**`,
          `\`${updater}\``,
          ``,
          `**Risk:**`,
          `\`${rating}\``
        ].join('\n');

        await logger.log(newRole.guild, 'Permission Escalation', alertEmbed, 'threat-alerts');
        await socManager.sendToThread(newRole.guild, 'threatAnalysis', `🚨 **PERMISSION ESCALATION**\nRole: ${newRole.toString()}\nPermission: \`${perm}\`\nBy: \`${updater}\` (Risk: \`${rating}\`)`);
      }
    }

    if (executor) {
      const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
      
      if (isWatched) {
        await logger.log(newRole.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** modified role ${newRole.toString()}.`, 'security-logs');
      }

      if (executor.bot) {
        await logger.log(newRole.guild, 'BOT_ROLE_UPDATE', `Bot **${executor.tag}** modified role ${newRole.toString()}.`, 'bot-watchdog');
        await socManager.sendToThread(newRole.guild, 'botActivity', `🤖 Bot **${executor.tag}** modified role ${newRole.toString()}`);
      } else {
        await logger.log(newRole.guild, 'ADMIN_ROLE_UPDATE', `Admin/User **${executor.tag}** modified role ${newRole.toString()}.`, 'admin-logs');
        await socManager.sendToThread(newRole.guild, 'adminActivity', `🛡️ Admin **${executor.tag}** modified role ${newRole.toString()}`);
      }
    }
  },
};
