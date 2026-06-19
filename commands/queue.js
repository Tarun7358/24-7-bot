const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'queue',
  description: 'Display the server music queue',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const player = client.musicPlayers.get(message.guild.id);
    if (!player || player.queue.length === 0) {
      return message.reply({ content: 'Queue is empty.' });
    }

    const embed = generateQueueEmbed(player);
    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'queue',
    description: 'Display the server music queue'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const player = client.musicPlayers.get(interaction.guild.id);
    if (!player || player.queue.length === 0) {
      return interaction.reply({ content: 'Queue is empty.', ephemeral: true });
    }

    const embed = generateQueueEmbed(player);
    await interaction.reply({ embeds: [embed] });
  }
};

function generateQueueEmbed(player) {
  const current = player.currentIndex;
  const list = player.queue.map((song, idx) => {
    const isCurrent = idx === current - 1;
    return `${isCurrent ? '👉 ' : ''}${idx + 1}. **${song.title}** (\`${song.duration}\`)`;
  }).slice(0, 10).join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setTitle('XTREMEZ Music Queue')
    .setDescription(list)
    .setTimestamp();
}
