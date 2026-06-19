const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'timeout',
  description: 'Timeout a member in the server',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply({ content: 'Please mention a valid member to timeout.' });

    const minutes = parseInt(args[1]) || 10;
    const reason = args.slice(2).join(' ') || 'No reason provided';
    const durationMs = minutes * 60 * 1000;

    try {
      await target.timeout(durationMs, reason);
      db.addModerationLog('TIMEOUT', target.user.tag, message.author.tag, `${minutes}m: ${reason}`);
      message.reply({ content: `🛡️ **${target.user.tag}** has been timed out for ${minutes} minutes. Reason: \`${reason}\`` });
    } catch (err) {
      message.reply({ content: `Failed to timeout member: ${err.message}` });
    }
  },

  slashData: {
    name: 'timeout',
    description: 'Timeout a member in the server',
    default_member_permissions: String(PermissionFlagsBits.ModerateMembers),
    options: [
      {
        name: 'user',
        description: 'The member to timeout',
        type: 6,
        required: true
      },
      {
        name: 'minutes',
        description: 'Duration of timeout in minutes (default 10)',
        type: 4, // INTEGER
        required: false
      },
      {
        name: 'reason',
        description: 'Reason for the timeout',
        type: 3,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes') || 10;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const durationMs = minutes * 60 * 1000;

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: 'Member not found in this guild.', ephemeral: true });

    try {
      await targetMember.timeout(durationMs, reason);
      db.addModerationLog('TIMEOUT', targetUser.tag, interaction.user.tag, `${minutes}m: ${reason}`);
      await interaction.reply({ content: `🛡️ **${targetUser.tag}** has been timed out for ${minutes} minutes. Reason: \`${reason}\`` });
    } catch (err) {
      await interaction.reply({ content: `Failed to timeout member: ${err.message}`, ephemeral: true });
    }
  }
};
