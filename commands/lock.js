const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'lock',
  description: 'Lock this channel (prevent members from sending messages)',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false
      });
      db.addModerationLog('LOCK', `Channel: #${message.channel.name}`, message.author.tag, 'Channel locked.');
      message.reply({ content: '🔒 This channel has been locked.' });
    } catch (err) {
      message.reply({ content: `Failed to lock channel: ${err.message}` });
    }
  },

  slashData: {
    name: 'lock',
    description: 'Lock this channel (prevent members from sending messages)',
    default_member_permissions: String(PermissionFlagsBits.ManageChannels)
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false
      });
      db.addModerationLog('LOCK', `Channel: #${interaction.channel.name}`, interaction.user.tag, 'Channel locked.');
      await interaction.reply({ content: '🔒 This channel has been locked.' });
    } catch (err) {
      await interaction.reply({ content: `Failed to lock channel: ${err.message}`, ephemeral: true });
    }
  }
};
