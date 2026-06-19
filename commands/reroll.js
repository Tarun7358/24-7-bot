const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'reroll',
  description: 'Reroll winners for an ended giveaway',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const msgId = args[0];
    if (!msgId) return message.reply({ content: 'Please provide the giveaway message ID.' });

    const data = db.getDb();
    const gw = data.giveaways.find(g => g.messageId === msgId);
    if (!gw) return message.reply({ content: 'Giveaway record not found.' });

    try {
      const channel = await message.guild.channels.fetch(gw.channelId).catch(() => null);
      if (!channel) return message.reply({ content: 'Giveaway channel not found.' });

      const msg = await channel.messages.fetch(gw.messageId).catch(() => null);
      if (!msg) return message.reply({ content: 'Giveaway message not found.' });

      const reaction = msg.reactions.cache.get('🎉');
      let participants = [];
      if (reaction) {
        const usersCollection = await reaction.users.fetch();
        participants = usersCollection.filter(u => !u.bot).map(u => u.id);
      }

      if (participants.length === 0) {
        return message.reply({ content: 'No participants available to reroll.' });
      }

      const winnerId = participants[Math.floor(Math.random() * participants.length)];
      channel.send(`🎉 **REROLL:** Congratulations <@${winnerId}>! You are the new winner of the giveaway for **${gw.prize}**!`);
      message.reply({ content: '✅ Giveaway successfully rerolled!' });
    } catch (err) {
      message.reply({ content: `Failed to reroll giveaway: ${err.message}` });
    }
  },

  slashData: {
    name: 'reroll',
    description: 'Reroll winners for an ended giveaway',
    default_member_permissions: String(PermissionFlagsBits.ManageGuild),
    options: [
      {
        name: 'message_id',
        description: 'The giveaway message ID',
        type: 3,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const msgId = interaction.options.getString('message_id');

    const data = db.getDb();
    const gw = data.giveaways.find(g => g.messageId === msgId);
    if (!gw) return interaction.reply({ content: 'Giveaway record not found.', ephemeral: true });

    try {
      await interaction.deferReply({ ephemeral: true });
      const channel = await interaction.guild.channels.fetch(gw.channelId).catch(() => null);
      if (!channel) return interaction.editReply({ content: 'Giveaway channel not found.' });

      const msg = await channel.messages.fetch(gw.messageId).catch(() => null);
      if (!msg) return interaction.editReply({ content: 'Giveaway message not found.' });

      const reaction = msg.reactions.cache.get('🎉');
      let participants = [];
      if (reaction) {
        const usersCollection = await reaction.users.fetch();
        participants = usersCollection.filter(u => !u.bot).map(u => u.id);
      }

      if (participants.length === 0) {
        return interaction.editReply({ content: 'No participants available to reroll.' });
      }

      const winnerId = participants[Math.floor(Math.random() * participants.length)];
      await channel.send(`🎉 **REROLL:** Congratulations <@${winnerId}>! You are the new winner of the giveaway for **${gw.prize}**!`);
      await interaction.editReply({ content: '✅ Giveaway successfully rerolled!' });
    } catch (err) {
      await interaction.editReply({ content: `Failed to reroll giveaway: ${err.message}` });
    }
  }
};
