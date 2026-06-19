const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'servericon',
  description: 'Display the server icon',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const iconUrl = message.guild.iconURL({ dynamic: true, size: 1024 });

    if (!iconUrl) {
      return message.reply({ content: 'This server does not have an icon.' });
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${message.guild.name}'s Icon`)
      .setImage(iconUrl)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'servericon',
    description: 'Display the server icon'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const iconUrl = interaction.guild.iconURL({ dynamic: true, size: 1024 });

    if (!iconUrl) {
      return interaction.reply({ content: 'This server does not have an icon.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${interaction.guild.name}'s Icon`)
      .setImage(iconUrl)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
