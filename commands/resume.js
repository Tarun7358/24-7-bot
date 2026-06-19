module.exports = {
  name: 'resume',
  description: 'Resume the paused music playback',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const player = client.musicPlayers.get(message.guild.id);
    if (!player) return message.reply({ content: 'No music session exists.' });

    player.resume();
    message.reply({ content: '▶️ Playback resumed.' });
  },

  slashData: {
    name: 'resume',
    description: 'Resume the paused music playback'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const player = client.musicPlayers.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'No music session exists.', ephemeral: true });

    player.resume();
    await interaction.reply({ content: '▶️ Playback resumed.' });
  }
};
