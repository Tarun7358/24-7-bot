const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'verify',
  description: 'Manually verify a user in the server',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const targetMember = message.mentions.members.first();
    if (!targetMember) return message.reply({ content: 'Please mention a member to verify.' });

    const data = db.getDb();
    const verifiedRole = data.verification.roleId;
    if (!verifiedRole) {
      return message.reply({ content: 'Verification role is not configured. Use /setupverify first.' });
    }

    try {
      await targetMember.roles.add(verifiedRole);
      db.addSecurityEvent('USER_VERIFIED', targetMember.user.tag, `Manually verified by ${message.author.tag}`);
      message.reply({ content: `✅ **${targetMember.user.tag}** has been manually verified.` });
    } catch (err) {
      message.reply({ content: `Failed to verify member: ${err.message}` });
    }
  },

  slashData: {
    name: 'verify',
    description: 'Manually verify a user in the server',
    default_member_permissions: String(PermissionFlagsBits.ManageRoles),
    options: [
      {
        name: 'user',
        description: 'The user to manually verify',
        type: 6,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: 'Member not found in this guild.', ephemeral: true });

    const data = db.getDb();
    const verifiedRole = data.verification.roleId;
    if (!verifiedRole) {
      return interaction.reply({ content: 'Verification role is not configured. Use /setupverify first.', ephemeral: true });
    }

    try {
      await targetMember.roles.add(verifiedRole);
      db.addSecurityEvent('USER_VERIFIED', targetUser.tag, `Manually verified by ${interaction.user.tag}`);
      await interaction.reply({ content: `✅ **${targetUser.tag}** has been manually verified.` });
    } catch (err) {
      await interaction.reply({ content: `Failed to verify member: ${err.message}`, ephemeral: true });
    }
  }
};
