const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  description: 'Display the currently playing song details',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const player = client.musicPlayers.get(message.guild.id);
    if (!player || !player.isPlaying) {
      return message.reply({ content: 'No music is currently playing.' });
    }

    const embed = generateNPEmbed(player);
    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'nowplaying',
    description: 'Display the currently playing song details'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const player = client.musicPlayers.get(interaction.guild.id);
    if (!player || !player.isPlaying) {
      return interaction.reply({ content: 'No music is currently playing.', ephemeral: true });
    }

    const embed = generateNPEmbed(player);
    await interaction.reply({ embeds: [embed] });
  }
};

function generateNPEmbed(player) {
  const song = player.queue[player.currentIndex - 1];
  
  const embed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setTitle('🎵 NOW PLAYING')
    .setDescription(`**[${song.title}](${song.url})**\n\n• **Duration:** \`${song.duration}\``)
    .setTimestamp();

  if (song.thumbnail) {
    embed.setThumbnail(song.thumbnail);
  }

  return embed;
}
