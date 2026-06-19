const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'suggest',
  description: 'Submit a new server suggestion',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const text = args.join(' ');
    if (!text) return message.reply({ content: 'Please specify the suggestion text.' });

    let channel = message.guild.channels.cache.find(c => c.name === 'suggestions' || c.name === 'suggest');
    if (!channel) channel = message.channel;

    const sugId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `╔════════════════════╗`,
        `║  NEW SUGGESTION    ║`,
        `╚════════════════════╝`,
        ``,
        `• **Suggestion ID:** \`${sugId}\``,
        `• **Author:** ${message.author.tag} (${message.author.toString()})`,
        `• **Status:** 🟡 Pending Feedback`,
        ``,
        `**Suggestion:**`,
        `\`\`\`\n${text}\n\`\`\``
      ].join('\n'))
      .setTimestamp();

    try {
      const msg = await channel.send({ embeds: [embed] });
      await msg.react('👍');
      await msg.react('👎');

      db.addSuggestion(sugId, message.author.tag, text, msg.id, channel.id);
      message.reply({ content: `✅ Suggestion submitted to ${channel.toString()} (ID: \`${sugId}\`).` });
    } catch (err) {
      message.reply({ content: `Failed to submit suggestion: ${err.message}` });
    }
  },

  slashData: {
    name: 'suggest',
    description: 'Submit a new server suggestion',
    options: [
      {
        name: 'suggestion',
        description: 'Your suggestion text',
        type: 3, // STRING
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const text = interaction.options.getString('suggestion');

    let channel = interaction.guild.channels.cache.find(c => c.name === 'suggestions' || c.name === 'suggest');
    if (!channel) channel = interaction.channel;

    const sugId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `╔════════════════════╗`,
        `║  NEW SUGGESTION    ║`,
        `╚════════════════════╝`,
        ``,
        `• **Suggestion ID:** \`${sugId}\``,
        `• **Author:** ${interaction.user.tag} (${interaction.user.toString()})`,
        `• **Status:** 🟡 Pending Feedback`,
        ``,
        `**Suggestion:**`,
        `\`\`\`\n${text}\n\`\`\``
      ].join('\n'))
      .setTimestamp();

    try {
      await interaction.deferReply({ ephemeral: true });
      const msg = await channel.send({ embeds: [embed] });
      await msg.react('👍');
      await msg.react('👎');

      db.addSuggestion(sugId, interaction.user.tag, text, msg.id, channel.id);
      await interaction.editReply({ content: `✅ Suggestion submitted to ${channel.toString()} (ID: \`${sugId}\`).` });
    } catch (err) {
      await interaction.editReply({ content: `Failed to submit suggestion: ${err.message}` });
    }
  }
};
