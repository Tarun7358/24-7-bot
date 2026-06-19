const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'slowmode',
  description: 'Set message slowmode interval for this channel',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0) {
      return message.reply({ content: 'Please specify a valid number of seconds (0 to disable).' });
    }

    try {
      await message.channel.setRateLimitPerUser(seconds);
      db.addModerationLog('SLOWMODE', `Channel: #${message.channel.name}`, message.author.tag, `Slowmode set to ${seconds}s.`);
      message.reply({ content: `✅ Slowmode set to \`${seconds}\` seconds in this channel.` });
    } catch (err) {
      message.reply({ content: `Failed to set slowmode: ${err.message}` });
    }
  },

  slashData: {
    name: 'slowmode',
    description: 'Set message slowmode interval for this channel',
    default_member_permissions: String(PermissionFlagsBits.ManageChannels),
    options: [
      {
        name: 'seconds',
        description: 'Slowmode delay in seconds (0 to disable)',
        type: 4,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const seconds = interaction.options.getInteger('seconds');
    if (seconds < 0) return interaction.reply({ content: 'Seconds must be 0 or higher.', ephemeral: true });

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      db.addModerationLog('SLOWMODE', `Channel: #${interaction.channel.name}`, interaction.user.tag, `Slowmode set to ${seconds}s.`);
      await interaction.reply({ content: `✅ Slowmode set to \`${seconds}\` seconds in this channel.` });
    } catch (err) {
      await interaction.reply({ content: `Failed to set slowmode: ${err.message}`, ephemeral: true });
    }
  }
};
