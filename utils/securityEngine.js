const { PermissionFlagsBits } = require('discord.js');
const db = require('./db');

const rateTracker = {};

module.exports = {
  calculateHealthScore(guild) {
    const data = db.getDb();
    const warnings = [];
    
    // 1. Verification (Max 20%)
    let verificationScore = 20;
    if (guild.verificationLevel === 0) {
      verificationScore -= 10;
      warnings.push('⚠️ Guild verification level is set to None (unprotected against bot raids).');
    }
    const ver = data.verification;
    if (!ver || !ver.roleId || !ver.channelId) {
      verificationScore -= 10;
      warnings.push('⚠️ XTREMEZ Verification system is unconfigured (/setupverify).');
    }

    // 2. Permission Security (Max 20%)
    let permissionScore = 20;
    const adminRoles = [];
    const highRiskRoles = [];
    const protectedRoles = [];

    guild.roles.cache.forEach(role => {
      if (role.name === '@everyone') {
        const hasDangerous = role.permissions.has([
          PermissionFlagsBits.Administrator,
          PermissionFlagsBits.ManageGuild,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.KickMembers,
          PermissionFlagsBits.BanMembers,
          PermissionFlagsBits.ManageWebhooks
        ]);
        if (hasDangerous) {
          permissionScore -= 10;
          warnings.push('⚠️ The @everyone role has dangerous permissions enabled.');
        }
        return;
      }

      if (role.permissions.has(PermissionFlagsBits.Administrator)) {
        adminRoles.push(role.name);
      } else if (
        role.permissions.has([
          PermissionFlagsBits.ManageGuild,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageWebhooks
        ])
      ) {
        highRiskRoles.push(role.name);
      } else {
        protectedRoles.push(role.name);
      }
    });

    if (adminRoles.length > 3) {
      permissionScore -= 5;
      warnings.push(`⚠️ Excessive Administrator roles configured (${adminRoles.length} roles).`);
    }

    // 3. Protected Roles (Max 15%)
    let protectedRolesScore = 15;
    const configuredProtectedRoles = data.soc.protectedRoles || [];
    if (configuredProtectedRoles.length === 0) {
      protectedRolesScore -= 10;
      warnings.push('⚠️ No protected roles are configured. Use /protectrole to monitor critical roles.');
    }

    // 4. Protected Channels (Max 15%)
    let protectedChannelsScore = 15;
    const configuredProtectedChannels = data.soc.protectedChannels || [];
    if (configuredProtectedChannels.length === 0) {
      protectedChannelsScore -= 10;
      warnings.push('⚠️ No protected channels are configured. Use /protectchannel to monitor critical channels.');
    }

    // 5. Audit Monitoring (Max 10%)
    let auditScore = 10;
    const botMember = guild.members.me;
    if (botMember && !botMember.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      auditScore -= 10;
      warnings.push('⚠️ Bot lacks "View Audit Log" permission (cannot audit administrator activities).');
    }

    // 6. Bot Security (Max 10%)
    let botSecurityScore = 10;
    const bots = guild.members.cache.filter(m => m.user.bot);
    const adminBots = bots.filter(m => m.permissions.has(PermissionFlagsBits.Administrator));
    if (adminBots.size > 2) {
      botSecurityScore -= 5;
      warnings.push(`⚠️ Multiple bots have Administrator privileges (${adminBots.size} bots).`);
    }

    // 7. Webhook Security (Max 10%)
    let webhookSecurityScore = 10;
    
    const totalScore = verificationScore + permissionScore + protectedRolesScore + protectedChannelsScore + auditScore + botSecurityScore + webhookSecurityScore;
    const score = Math.max(0, Math.min(Math.round(totalScore), 100));

    let grade = 'CRITICAL';
    if (score >= 95) grade = 'ELITE';
    else if (score >= 85) grade = 'SECURE';
    else if (score >= 70) grade = 'GOOD';
    else if (score >= 50) grade = 'MODERATE';
    else if (score >= 30) grade = 'HIGH RISK';

    return {
      score,
      grade,
      adminRoles: adminRoles.slice(0, 5),
      highRiskRoles: highRiskRoles.slice(0, 5),
      protectedRoles: protectedRoles.slice(0, 5),
      warnings: warnings.slice(0, 8)
    };
  },

  trackRateLimit(guildId, action, limit, windowMs) {
    if (!rateTracker[guildId]) rateTracker[guildId] = {};
    if (!rateTracker[guildId][action]) rateTracker[guildId][action] = [];

    const now = Date.now();
    rateTracker[guildId][action] = rateTracker[guildId][action].filter(time => now - time < windowMs);
    rateTracker[guildId][action].push(now);

    const triggered = rateTracker[guildId][action].length > limit;
    if (triggered) {
      rateTracker[guildId][action] = [];
    }

    return triggered;
  },

  detectMsgThreats(message) {
    if (!message.guild) return false;

    const mentionLimit = 5;
    const mentionsCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionsCount > mentionLimit) {
      db.addThreat('Mass Mention Spam', 'HIGH', `${message.author.tag} mentioned ${mentionsCount} users/roles in a message.`);
      db.addSecurityEvent('MASS_MENTIONS', message.author.tag, `Sent message with ${mentionsCount} mentions in #${message.channel.name}`);
      db.addAutoMod('AntiSpam Action', 'Alert Triggered', `Flagged ${message.author.tag} for mass mentions.`);
      return true;
    }
    return false;
  }
};
