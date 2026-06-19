const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const socManager = require('../utils/socManager');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    if (!newMember.guild) return;

    // 1. Nickname Changes
    if (oldMember.nickname !== newMember.nickname) {
      const oldNick = oldMember.nickname || oldMember.user.username;
      const newNick = newMember.nickname || newMember.user.username;
      db.addLiveFeed('Nickname Changed', `${oldMember.user.tag}: ${oldNick} -> ${newNick}`);
      
      const logDetails = `• **User:** ${newMember.toString()}\n• **Change:** \`${oldNick}\` ➔ \`${newNick}\``;
      await logger.log(newMember.guild, 'Nickname Changed', logDetails, 'security-logs');
      await socManager.sendToThread(newMember.guild, 'securityEvents', `👥 **Nickname Changed:** ${newMember.user.tag}: \`${oldNick}\` ➔ \`${newNick}\``);
    }

    // 2. Server Boost Events
    if (!oldMember.premiumSince && newMember.premiumSince) {
      db.addLiveFeed('Boost Event', `${newMember.user.tag} boosted the server! 🚀`);
      db.addSecurityEvent('SERVER_BOOST', newMember.user.tag, 'Started boosting the server.');
      
      const logDetails = `• **User:** ${newMember.user.tag} (${newMember.toString()})\n• **Details:** Server boost count has increased.`;
      await logger.log(newMember.guild, 'Server Boosted', logDetails, 'security-logs');
      await socManager.sendToThread(newMember.guild, 'securityEvents', `🚀 **Server Boosted:** ${newMember.user.tag} (${newMember.toString()})`);
    }

    // 3. Timeout Detection
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (newTimeout && newTimeout !== oldTimeout && newTimeout > Date.now()) {
      db.addLiveFeed('Member Timed Out', newMember.user.tag);
      db.addSecurityEvent('MEMBER_TIMEOUT', newMember.user.tag, `Timed out until ${new Date(newTimeout).toLocaleTimeString()}`);
      
      let modTag = 'System';
      let timeoutReason = 'No reason provided';
      let executor = null;

      try {
        const botMe = newMember.guild.members.me;
        if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
          const fetchedLogs = await newMember.guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MemberUpdate,
          });
          const timeoutLog = fetchedLogs.entries.find(
            entry => entry.target.id === newMember.id && Date.now() - entry.createdAt.getTime() < 8000
          );
          if (timeoutLog) {
            executor = timeoutLog.executor;
            modTag = executor ? executor.tag : 'System';
            timeoutReason = timeoutLog.reason || 'No reason provided';
          }
        }
      } catch (err) {
        // Ignore
      }

      db.addModerationLog('TIMEOUT', newMember.user.tag, modTag, timeoutReason);
      
      const logDetails = `• **User:** ${newMember.user.tag} (${newMember.toString()})\n• **Duration:** Until <t:${Math.floor(newTimeout / 1000)}:f>\n• **Moderator:** \`${modTag}\`\n• **Reason:** \`${timeoutReason}\``;
      await logger.log(newMember.guild, 'Member Timed Out', logDetails, 'admin-logs');
      await socManager.sendToThread(newMember.guild, 'adminActivity', `🛡️ **Member Timed Out:** ${newMember.user.tag} by \`${modTag}\` (Reason: \`${timeoutReason}\`)`);

      if (executor) {
        const data = db.getDb();
        const isWatched = data.soc?.watchlist?.users?.includes(executor.id) || data.soc?.watchlist?.bots?.includes(executor.id);
        if (isWatched) {
          await logger.log(newMember.guild, 'WATCHED_ACTION', `Watched user/bot **${executor.tag}** timed out member ${newMember.user.tag}.`, 'security-logs');
        }

        if (executor.bot) {
          await logger.log(newMember.guild, 'BOT_TIMEOUT_ACTION', `Bot **${executor.tag}** timed out user ${newMember.user.tag}.`, 'bot-watchdog');
          await socManager.sendToThread(newMember.guild, 'botActivity', `🤖 Bot **${executor.tag}** timed out ${newMember.user.tag}`);
        }
      }
    }

    // 4. Role Assignments & Escalation Detection
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      let executor = null;
      let updater = 'Unknown';

      try {
        const botMe = newMember.guild.members.me;
        if (botMe && botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
          const fetchedLogs = await newMember.guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MemberRoleUpdate,
          });
          const roleUpdateLog = fetchedLogs.entries.find(
            entry => entry.target.id === newMember.id && Date.now() - entry.createdAt.getTime() < 8000
          );
          if (roleUpdateLog) {
            executor = roleUpdateLog.executor;
            updater = executor ? executor.tag : 'Unknown';
          }
        }
      } catch (err) {
        // Ignore
      }

      const data = db.getDb();

      // Check added roles
      for (const role of addedRoles.values()) {
        const isProtected = data.soc?.protectedRoles?.includes(role.id) || data.soc?.protectedRoles?.includes(role.name);
        const hasAdmin = role.permissions.has(PermissionFlagsBits.Administrator);

        // Thread log
        await socManager.sendToThread(newMember.guild, 'adminActivity', `🛡️ **Role Assigned:** ${newMember.user.tag} was given role \`@${role.name}\` by \`${updater}\``);

        if (isProtected) {
          const alertMsg = `Protected role **@${role.name}** was assigned to **${newMember.user.tag}** by **${updater}**.`;
          db.addThreat('Protected Role Modification', 'HIGH', alertMsg);
          await logger.log(newMember.guild, '⚠️ HIGH ALERT', `• **Incident:** Protected Role Assigned\n• **Target:** ${newMember.toString()}\n• **Role:** \`@${role.name}\`\n• **By:** **${updater}**\n• **Risk Rating:** \`HIGH\``, 'threat-alerts');
        }

        if (hasAdmin) {
          const isTargetBot = newMember.user.bot;
          const riskRating = isTargetBot ? 'CRITICAL' : 'HIGH';
          
          db.addThreat('Administrator Role Assigned', riskRating, `Role @${role.name} (with Administrator) was granted to ${newMember.user.tag} by ${updater}.`);

          const alertEmbed = [
            `⚠️ **Security Alert**`,
            ``,
            `**User / Bot:**`,
            `${newMember.user.tag} (${isTargetBot ? 'Bot' : 'User'})`,
            ``,
            `**Administrator Granted:**`,
            `@${role.name}`,
            ``,
            `**Changed By:**`,
            `\`${updater}\``,
            ``,
            `**Risk:**`,
            `\`${riskRating}\``
          ].join('\n');

          await logger.log(newMember.guild, 'Administrator Role Assigned', alertEmbed, 'threat-alerts');
          await socManager.sendToThread(newMember.guild, 'threatAnalysis', `🚨 **ADMINISTRATOR GRANTED**\nTarget: ${newMember.toString()}\nRole: \`@${role.name}\`\nBy: \`${updater}\` (Risk: \`${riskRating}\`)`);
        }

        if (executor && executor.bot) {
          await logger.log(newMember.guild, 'BOT_ROLE_ASSIGNMENT', `Bot **${executor.tag}** assigned role \`@${role.name}\` to ${newMember.user.tag}.`, 'bot-watchdog');
        }
      }

      // Check removed roles
      for (const role of removedRoles.values()) {
        const isProtected = data.soc?.protectedRoles?.includes(role.id) || data.soc?.protectedRoles?.includes(role.name);
        
        await socManager.sendToThread(newMember.guild, 'adminActivity', `🛡️ **Role Removed:** ${newMember.user.tag} lost role \`@${role.name}\` via \`${updater}\``);

        if (isProtected) {
          const alertMsg = `Protected role **@${role.name}** was removed from **${newMember.user.tag}** by **${updater}**.`;
          db.addThreat('Protected Role Modification', 'HIGH', alertMsg);
          await logger.log(newMember.guild, '⚠️ HIGH ALERT', `• **Incident:** Protected Role Removed\n• **Target:** ${newMember.toString()}\n• **Role:** \`@${role.name}\`\n• **By:** **${updater}**\n• **Risk Rating:** \`HIGH\``, 'threat-alerts');
        }
      }
    }
  },
};
