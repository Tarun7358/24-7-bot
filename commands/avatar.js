const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  description: 'Display the avatar of a user',
  
  async execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${user.tag}'s Avatar`)
      .setImage(avatarUrl)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'avatar',
    description: 'Display the avatar of a user',
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
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle(`${user.tag}'s Avatar`)
      .setImage(avatarUrl)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
