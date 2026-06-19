const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'warn',
  description: 'Issue a formal warning to a user',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply({ content: 'Please mention a valid user to warn.' });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    try {
      const warnCount = db.warnUser(targetUser.id, message.author.tag, reason);
      db.addModerationLog('WARN', targetUser.tag, message.author.tag, reason);
      
      message.reply({ 
        content: `⚠️ **${targetUser.tag}** has been warned.\n• **Reason:** \`${reason}\`\n• **Total Warnings:** \`${warnCount}\`` 
      });
    } catch (err) {
      message.reply({ content: `Failed to issue warning: ${err.message}` });
    }
  },

  slashData: {
    name: 'warn',
    description: 'Issue a formal warning to a user',
    default_member_permissions: String(PermissionFlagsBits.ModerateMembers),
    options: [
      {
        name: 'user',
        description: 'The user to warn',
        type: 6,
        required: true
      },
      {
        name: 'reason',
        description: 'Reason for the warning',
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
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const warnCount = db.warnUser(targetUser.id, interaction.user.tag, reason);
      db.addModerationLog('WARN', targetUser.tag, interaction.user.tag, reason);
      
      await interaction.reply({ 
        content: `⚠️ **${targetUser.tag}** has been warned.\n• **Reason:** \`${reason}\`\n• **Total Warnings:** \`${warnCount}\`` 
      });
    } catch (err) {
      await interaction.reply({ content: `Failed to issue warning: ${err.message}`, ephemeral: true });
    }
  }
};
