const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply({ content: 'Please mention a valid member to ban.' });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!target.bannable) return message.reply({ content: 'I cannot ban this member.' });

    try {
      await target.ban({ reason });
      db.addModerationLog('BAN', target.user.tag, message.author.tag, reason);
      message.reply({ content: `🛡️ **${target.user.tag}** has been banned. Reason: \`${reason}\`` });
    } catch (err) {
      message.reply({ content: `Failed to ban member: ${err.message}` });
    }
  },

  slashData: {
    name: 'ban',
    description: 'Ban a member from the server',
    default_member_permissions: String(PermissionFlagsBits.BanMembers),
    options: [
      {
        name: 'user',
        description: 'The member to ban',
        type: 6, // USER type
        required: true
      },
      {
        name: 'reason',
        description: 'Reason for the ban',
        type: 3, // STRING type
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: 'Member not found in this guild.', ephemeral: true });
    if (!targetMember.bannable) return interaction.reply({ content: 'I cannot ban this member.', ephemeral: true });

    try {
      await targetMember.ban({ reason });
      db.addModerationLog('BAN', targetUser.tag, interaction.user.tag, reason);
      await interaction.reply({ content: `🛡️ **${targetUser.tag}** has been banned. Reason: \`${reason}\`` });
    } catch (err) {
      await interaction.reply({ content: `Failed to ban member: ${err.message}`, ephemeral: true });
    }
  }
};
