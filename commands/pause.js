module.exports = {
  name: 'pause',
  description: 'Pause the current music playback',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const player = client.musicPlayers.get(message.guild.id);
    if (!player || !player.isPlaying) {
      return message.reply({ content: 'No music is currently playing.' });
    }

    player.pause();
    message.reply({ content: '⏸️ Playback paused.' });
  },

  slashData: {
    name: 'pause',
    description: 'Pause the current music playback'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const player = client.musicPlayers.get(interaction.guild.id);
    if (!player || !player.isPlaying) {
      return interaction.reply({ content: 'No music is currently playing.', ephemeral: true });
    }

    player.pause();
    await interaction.reply({ content: '⏸️ Playback paused.' });
  }
};
