const { PermissionFlagsBits } = require('discord.js');
const db = require('./db');

const rateTracker = {};

module.exports = {
  calculateHealthScore(guild) {
    let score = 100;
    const warnings = [];
    const adminRoles = [];
    const highRiskRoles = [];
    const protectedRoles = [];

    const roles = guild.roles.cache;
    
    // 1. Audit Roles & Permissions
    roles.forEach(role => {
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
          score -= 40;
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

    // Too many admin roles risk
    if (adminRoles.length > 3) {
      const penalty = Math.min((adminRoles.length - 3) * 5, 15);
      score -= penalty;
      warnings.push(`⚠️ Excessive Administrator roles configured (${adminRoles.length} roles).`);
    }

    // 2. Verification Settings
    if (guild.verificationLevel === 0) { // NONE
      score -= 15;
      warnings.push('⚠️ Server verification level is set to None (unprotected against bots).');
    }

    // 3. MFA requirement for moderators
    if (guild.mfaLevel === 0) { // NONE
      score -= 10;
      warnings.push('⚠️ 2FA requirement for moderators is disabled.');
    }

    // 4. Explicit content filter
    if (guild.explicitContentFilter === 0) { // DISABLED
      score -= 10;
      warnings.push('⚠️ Explicit content filter is disabled.');
    }

    // 5. Bot permissions check (Audit Logs)
    const botMember = guild.members.me;
    if (botMember && !botMember.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      score -= 10;
      warnings.push('⚠️ Bot lacks "View Audit Log" permission (limited monitoring capabilities).');
    }

    // Clamp score
    score = Math.max(0, Math.min(score, 100));

    // Calculate Grade
    let grade = 'Critical';
    if (score >= 95) grade = 'Elite';
    else if (score >= 85) grade = 'Secure';
    else if (score >= 70) grade = 'Good';
    else if (score >= 50) grade = 'Moderate';

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
    // Keep events inside window
    rateTracker[guildId][action] = rateTracker[guildId][action].filter(time => now - time < windowMs);
    
    // Add current event
    rateTracker[guildId][action].push(now);

    const triggered = rateTracker[guildId][action].length > limit;
    
    if (triggered) {
      // Clear to prevent repeat triggers in rapid succession
      rateTracker[guildId][action] = [];
    }

    return triggered;
  },

  detectMsgThreats(message) {
    if (!message.guild) return;

    // Mass Mention detection
    const mentionLimit = 5;
    const mentionsCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionsCount > mentionLimit) {
      db.addThreat('Mass Mention Spam', 'High', `${message.author.tag} mentioned ${mentionsCount} users/roles in a message.`);
      db.addSecurityEvent('MASS_MENTIONS', message.author.tag, `Sent message with ${mentionsCount} mentions in #${message.channel.name}`);
      
      // AutoMod action simulation
      db.addAutoMod('AntiSpam Action', 'Alert Triggered', `Flagged ${message.author.tag} for mass mentions.`);
      return true;
    }
    return false;
  }
};
