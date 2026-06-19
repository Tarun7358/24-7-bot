const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');
const securityEngine = require('../utils/securityEngine');
const socManager = require('../utils/socManager');

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
  name: 'guildMemberAdd',
  async execute(member, client) {
    if (!member.guild) return;

    db.incrementJoins();
    db.addLiveFeed('Member Joined', member.user.tag);

    // 1. Audit joins spike
    const isJoinSpike = securityEngine.trackRateLimit(member.guild.id, 'memberJoin', 5, 60000);
    if (isJoinSpike) {
      db.addThreat('Suspicious Join Spike', 'MEDIUM', 'Excessive rapid user joins detected.');
      await logger.log(member.guild, '⚠️ THREAT ALERT', `• **Threat:** Suspicious Join Spike\n• **Risk Rating:** \`MEDIUM\`\n• **Details:** Rate limit exceeded (5+ member joins in 60s).`, 'threat-alerts');
      await socManager.sendToThread(member.guild, 'threatAnalysis', `🚨 **SUSPICIOUS JOIN SPIKE DETECTED**\nDetails: 5+ members joined within 60 seconds.`);
    }

    if (member.user.bot) {
      db.addSecurityEvent('BOT_ADDITION', member.user.tag, 'A new bot was added.');
      db.addThreat('Suspicious Bot Addition', 'MEDIUM', `Bot ${member.user.tag} (ID: ${member.id}) was invited.`);

      // Compute bot security profile
      const botPermsList = [];
      monitoredPerms.forEach(p => {
        if (member.permissions.has(p.flag)) {
          botPermsList.push(p.name);
        }
      });
      const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      const riskRating = hasAdmin ? 'HIGH' : botPermsList.length > 0 ? 'MEDIUM' : 'LOW';

      const botReport = [
        `🤖 **Bot Security Report**`,
        ``,
        `**Bot:**`,
        `${member.user.tag} (ID: ${member.id})`,
        ``,
        `**Join Date:**`,
        `<t:${Math.floor(Date.now() / 1000)}:f>`,
        ``,
        `**Administrator:**`,
        `\`${hasAdmin ? 'YES' : 'NO'}\``,
        ``,
        `**Risk:**`,
        `\`${riskRating}\``,
        ``,
        `**Dangerous Permissions:**`,
        botPermsList.length > 0 ? botPermsList.map(p => `\`${p}\``).join(', ') : 'None'
      ].join('\n');

      await logger.log(member.guild, 'Bot Invited', botReport, 'bot-watchdog');
      await socManager.sendToThread(member.guild, 'botActivity', `🤖 **Bot Added:** ${member.toString()} (${member.user.tag})\nAdministrator Status: \`${hasAdmin ? 'YES' : 'NO'}\` (Risk: \`${riskRating}\`)`);
    } else {
      const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
      await logger.log(member.guild, 'Member Joined', `• **User:** ${member.user.tag} (${member.toString()})\n• **ID:** \`${member.id}\`\n• **Account Age:** <t:${createdTimestamp}:R>`, 'security-logs');
      await socManager.sendToThread(member.guild, 'securityEvents', `👥 **Member Joined:** ${member.toString()} (${member.user.tag})`);
    }

    // Welcome message
    const welcomeChannel = member.guild.channels.cache.find(c => c.name === 'welcome' || c.name === 'joins' || c.name === 'chat');
    if (welcomeChannel && !member.user.bot) {
      const total = member.guild.memberCount;
      const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
      
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `╔════════════════════╗`,
          `║  WELCOME TO SERVER ║`,
          `╚════════════════════╝`,
          ``,
          `Welcome **${member.user.tag}** (${member.toString()}) to **${member.guild.name}**!`,
          `• You are member **#${total}**`,
          `• Account Created: <t:${createdTimestamp}:D> (<t:${createdTimestamp}:R>)`,
          ``,
          `*Please verify if required to unlock full access.*`
        ].join('\n'))
        .setTimestamp()
        .setFooter({ text: 'XTREMEZ Community Welcome' });

      welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(() => {});
    }

    // Auto-role assignment
    const unverifiedRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
    if (unverifiedRole && !member.user.bot) {
      try {
        await member.roles.add(unverifiedRole);
      } catch (err) {
        // Silent catch
      }
    }
  },
};
