const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'banner',
  description: 'Display the banner of a user',
  
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    
    try {
      const fetchedUser = await client.users.fetch(user.id, { force: true });
      const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

      if (!bannerUrl) {
        return message.reply({ content: `**${user.tag}** does not have a profile banner.` });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setTitle(`${user.tag}'s Banner`)
        .setImage(bannerUrl)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply({ content: `Failed to fetch banner: ${err.message}` });
    }
  },

  slashData: {
    name: 'banner',
    description: 'Display the banner of a user',
    options: [
      {
        name: 'user',
        description: 'The user to view',
        type: 6,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    
    try {
      await interaction.deferReply();
      const fetchedUser = await client.users.fetch(user.id, { force: true });
      const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

      if (!bannerUrl) {
        return interaction.editReply({ content: `**${user.tag}** does not have a profile banner.` });
      }

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setTitle(`${user.tag}'s Banner`)
        .setImage(bannerUrl)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: `Failed to fetch banner: ${err.message}` });
    }
  }
};
