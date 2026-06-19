const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'serverbanner',
  description: 'Display the server banner',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const bannerUrl = message.guild.bannerURL({ dynamic: true, size: 1024 });

    if (!bannerUrl) {
      return message.reply({ content: 'This server does not have a banner.' });
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${message.guild.name}'s Banner`)
      .setImage(bannerUrl)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'serverbanner',
    description: 'Display the server banner'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const bannerUrl = interaction.guild.bannerURL({ dynamic: true, size: 1024 });

    if (!bannerUrl) {
      return interaction.reply({ content: 'This server does not have a banner.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${interaction.guild.name}'s Banner`)
      .setImage(bannerUrl)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
