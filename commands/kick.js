const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply({ content: 'Please mention a valid member to kick.' });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!target.kickable) return message.reply({ content: 'I cannot kick this member.' });

    try {
      await target.kick(reason);
      db.addModerationLog('KICK', target.user.tag, message.author.tag, reason);
      message.reply({ content: `🛡️ **${target.user.tag}** has been kicked. Reason: \`${reason}\`` });
    } catch (err) {
      message.reply({ content: `Failed to kick member: ${err.message}` });
    }
  },

  slashData: {
    name: 'kick',
    description: 'Kick a member from the server',
    default_member_permissions: String(PermissionFlagsBits.KickMembers),
    options: [
      {
        name: 'user',
        description: 'The member to kick',
        type: 6,
        required: true
      },
      {
        name: 'reason',
        description: 'Reason for the kick',
        type: 3,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: 'Member not found in this guild.', ephemeral: true });
    if (!targetMember.kickable) return interaction.reply({ content: 'I cannot kick this member.', ephemeral: true });

    try {
      await targetMember.kick(reason);
      db.addModerationLog('KICK', targetUser.tag, interaction.user.tag, reason);
      await interaction.reply({ content: `🛡️ **${targetUser.tag}** has been kicked. Reason: \`${reason}\`` });
    } catch (err) {
      await interaction.reply({ content: `Failed to kick member: ${err.message}`, ephemeral: true });
    }
  }
};
