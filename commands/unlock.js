const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'unlock',
  description: 'Unlock this channel (allow members to send messages)',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null // Resets to default/allow inheritance or allow
      });
      db.addModerationLog('UNLOCK', `Channel: #${message.channel.name}`, message.author.tag, 'Channel unlocked.');
      message.reply({ content: '🔓 This channel has been unlocked.' });
    } catch (err) {
      message.reply({ content: `Failed to unlock channel: ${err.message}` });
    }
  },

  slashData: {
    name: 'unlock',
    description: 'Unlock this channel (allow members to send messages)',
    default_member_permissions: String(PermissionFlagsBits.ManageChannels)
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null
      });
      db.addModerationLog('UNLOCK', `Channel: #${interaction.channel.name}`, interaction.user.tag, 'Channel unlocked.');
      await interaction.reply({ content: '🔓 This channel has been unlocked.' });
    } catch (err) {
      await interaction.reply({ content: `Failed to unlock channel: ${err.message}`, ephemeral: true });
    }
  }
};
