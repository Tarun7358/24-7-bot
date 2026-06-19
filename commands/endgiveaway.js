const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');
const giveawayHelper = require('../utils/giveawayHelper');

module.exports = {
  name: 'endgiveaway',
  description: 'End an active server giveaway early',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const msgId = args[0];
    if (!msgId) return message.reply({ content: 'Please provide the giveaway message ID.' });

    const data = db.getDb();
    const gw = data.giveaways.find(g => g.messageId === msgId && !g.ended);
    if (!gw) return message.reply({ content: 'Giveaway not found or already ended.' });

    try {
      await giveawayHelper.drawGiveaway(client, gw);
      message.reply({ content: '✅ Giveaway ended and drawn.' });
    } catch (err) {
      message.reply({ content: `Failed to end giveaway: ${err.message}` });
    }
  },

  slashData: {
    name: 'endgiveaway',
    description: 'End an active server giveaway early',
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
    const gw = data.giveaways.find(g => g.messageId === msgId && !g.ended);
    if (!gw) return interaction.reply({ content: 'Giveaway not found or already ended.', ephemeral: true });

    try {
      await interaction.deferReply({ ephemeral: true });
      await giveawayHelper.drawGiveaway(client, gw);
      await interaction.editReply({ content: '✅ Giveaway ended and drawn.' });
    } catch (err) {
      await interaction.editReply({ content: `Failed to end giveaway: ${err.message}` });
    }
  }
};
