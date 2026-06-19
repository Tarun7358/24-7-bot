const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'endpoll',
  description: 'Tally the reactions on a poll and display results',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const msgId = args[0];
    if (!msgId) return message.reply({ content: 'Please provide the poll message ID.' });

    try {
      const msg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (!msg) return message.reply({ content: 'Poll message not found in this channel.' });

      const results = [];
      const reactions = msg.reactions.cache;
      
      reactions.forEach(reaction => {
        // Subtract 1 if the bot reacted
        const count = reaction.me ? reaction.count - 1 : reaction.count;
        results.push({ emoji: reaction.emoji.name, count });
      });

      results.sort((a, b) => b.count - a.count);

      const list = results.map(r => `${r.emoji}: \`${r.count} votes\``).join('\n') || '*No votes registered.*';

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `📊 **POLL RESULTS**`,
          `• **Poll ID:** \`${msg.id}\``,
          ``,
          list
        ].join('\n'))
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply({ content: `Failed to end poll: ${err.message}` });
    }
  },

  slashData: {
    name: 'endpoll',
    description: 'Tally the reactions on a poll and display results',
    options: [
      {
        name: 'message_id',
        description: 'The poll message ID',
        type: 3,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const msgId = interaction.options.getString('message_id');

    try {
      const msg = await interaction.channel.messages.fetch(msgId).catch(() => null);
      if (!msg) return interaction.reply({ content: 'Poll message not found in this channel.', ephemeral: true });

      const results = [];
      const reactions = msg.reactions.cache;
      
      reactions.forEach(reaction => {
        const count = reaction.me ? reaction.count - 1 : reaction.count;
        results.push({ emoji: reaction.emoji.name, count });
      });

      results.sort((a, b) => b.count - a.count);

      const list = results.map(r => `${r.emoji}: \`${r.count} votes\``).join('\n') || '*No votes registered.*';

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `📊 **POLL RESULTS**`,
          `• **Poll ID:** \`${msg.id}\``,
          ``,
          list
        ].join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `Failed to end poll: ${err.message}`, ephemeral: true }).catch(() => {});
    }
  }
};
