module.exports = {
  name: 'skip',
  description: 'Skip the currently playing song',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const player = client.musicPlayers.get(message.guild.id);
    if (!player || !player.isPlaying) {
      return message.reply({ content: 'No music is currently playing.' });
    }

    player.skip();
    message.reply({ content: '⏭️ Skipped current song.' });
  },

  slashData: {
    name: 'skip',
    description: 'Skip the currently playing song'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const player = client.musicPlayers.get(interaction.guild.id);
    if (!player || !player.isPlaying) {
      return interaction.reply({ content: 'No music is currently playing.', ephemeral: true });
    }

    player.skip();
    await interaction.reply({ content: '⏭️ Skipped current song.' });
  }
};
