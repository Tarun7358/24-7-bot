const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'nick',
  description: 'Change the nickname of a member',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply({ content: 'Please mention a member.' });

    const nickname = args.slice(1).join(' ');
    
    try {
      await target.setNickname(nickname || null);
      db.addModerationLog('NICKNAME', target.user.tag, message.author.tag, nickname ? `Set nickname to: ${nickname}` : 'Reset nickname');
      message.reply({ content: `✅ Nickname for **${target.user.tag}** has been updated.` });
    } catch (err) {
      message.reply({ content: `Failed to update nickname: ${err.message}` });
    }
  },

  slashData: {
    name: 'nick',
    description: 'Change the nickname of a member',
    default_member_permissions: String(PermissionFlagsBits.ManageNicknames),
    options: [
      {
        name: 'user',
        description: 'The member to modify',
        type: 6,
        required: true
      },
      {
        name: 'nickname',
        description: 'The new nickname (leave empty to reset)',
        type: 3,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const nickname = interaction.options.getString('nickname');

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: 'Member not found in this guild.', ephemeral: true });

    try {
      await targetMember.setNickname(nickname || null);
      db.addModerationLog('NICKNAME', targetUser.tag, interaction.user.tag, nickname ? `Set nickname to: ${nickname}` : 'Reset nickname');
      await interaction.reply({ content: `✅ Nickname for **${targetUser.tag}** has been updated.` });
    } catch (err) {
      await interaction.reply({ content: `Failed to update nickname: ${err.message}`, ephemeral: true });
    }
  }
};
