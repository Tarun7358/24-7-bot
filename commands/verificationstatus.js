const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'verificationstatus',
  description: 'Display verification configuration status',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const data = db.getDb();
    const verifiedRole = data.verification.roleId ? `<@&${data.verification.roleId}>` : '`Not Configured`';
    const channel = data.verification.channelId ? `<#${data.verification.channelId}>` : '`Not Configured`';
    const age = data.verification.requiredAgeDays;

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `🛡️ **XTREMEZ VERIFICATION CONFIGURATION**`,
        `• **Status:** ${data.verification.roleId ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Verification Channel:** ${channel}`,
        `• **Verified Role:** ${verifiedRole}`,
        `• **Required Account Age:** \`${age} days\``
      ].join('\n'))
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'verificationstatus',
    description: 'Display verification configuration status',
    default_member_permissions: String(PermissionFlagsBits.ManageGuild)
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const data = db.getDb();
    const verifiedRole = data.verification.roleId ? `<@&${data.verification.roleId}>` : '`Not Configured`';
    const channel = data.verification.channelId ? `<#${data.verification.channelId}>` : '`Not Configured`';
    const age = data.verification.requiredAgeDays;

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `🛡️ **XTREMEZ VERIFICATION CONFIGURATION**`,
        `• **Status:** ${data.verification.roleId ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Verification Channel:** ${channel}`,
        `• **Verified Role:** ${verifiedRole}`,
        `• **Required Account Age:** \`${age} days\``
      ].join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
