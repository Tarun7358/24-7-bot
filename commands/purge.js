const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'purge',
  description: 'Bulk delete messages from this channel',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ content: 'Please specify an amount of messages to delete (1-100).' });
    }

    try {
      // Fetch and delete
      const deleted = await message.channel.bulkDelete(amount, true);
      db.addModerationLog('PURGE', `Channel: #${message.channel.name}`, message.author.tag, `Deleted ${deleted.size} messages.`);
      
      const sent = await message.channel.send({ content: `✅ Deleted \`${deleted.size}\` messages.` });
      setTimeout(() => sent.delete().catch(() => {}), 3000);
    } catch (err) {
      message.reply({ content: `Failed to purge messages: ${err.message}` });
    }
  },

  slashData: {
    name: 'purge',
    description: 'Bulk delete messages from this channel',
    default_member_permissions: String(PermissionFlagsBits.ManageMessages),
    options: [
      {
        name: 'amount',
        description: 'Number of messages to delete (1-100)',
        type: 4, // INTEGER
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Amount must be between 1 and 100.', ephemeral: true });
    }

    try {
      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel.bulkDelete(amount, true);
      db.addModerationLog('PURGE', `Channel: #${interaction.channel.name}`, interaction.user.tag, `Deleted ${deleted.size} messages.`);
      
      await interaction.editReply({ content: `✅ Deleted \`${deleted.size}\` messages.` });
    } catch (err) {
      await interaction.editReply({ content: `Failed to purge messages: ${err.message}` });
    }
  }
};
