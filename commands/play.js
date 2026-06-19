const MusicPlayer = require('../utils/musicPlayer');

module.exports = {
  name: 'play',
  description: 'Play a song in your voice channel',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    
    const query = args.join(' ');
    if (!query) return message.reply({ content: 'Please provide a search query or link.' });

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ content: 'You need to join a voice channel first!' });

    let player = client.musicPlayers.get(message.guild.id);
    if (!player) {
      player = new MusicPlayer(message.guild, voiceChannel);
      client.musicPlayers.set(message.guild.id, player);
    }

    try {
      message.reply({ content: `🔍 Searching for \`${query}\`...` }).then(async msg => {
        const song = await player.addSong(query);
        if (song) {
          msg.edit({ content: `🎵 Added to queue: **${song.title}** (\`${song.duration}\`)` });
        } else {
          msg.edit({ content: '❌ Failed to find or play that song.' });
        }
      });
    } catch (err) {
      message.reply({ content: `Error: ${err.message}` });
    }
  },

  slashData: {
    name: 'play',
    description: 'Play a song in your voice channel',
    options: [
      {
        name: 'query',
        description: 'Song URL or name to search',
        type: 3,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;

    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true });

    let player = client.musicPlayers.get(interaction.guild.id);
    if (!player) {
      player = new MusicPlayer(interaction.guild, voiceChannel);
      client.musicPlayers.set(interaction.guild.id, player);
    }

    try {
      await interaction.reply({ content: `🔍 Searching for \`${query}\`...` });
      const song = await player.addSong(query);
      if (song) {
        await interaction.editReply({ content: `🎵 Added to queue: **${song.title}** (\`${song.duration}\`)` });
      } else {
        await interaction.editReply({ content: '❌ Failed to find or play that song.' });
      }
    } catch (err) {
      await interaction.editReply({ content: `Error: ${err.message}` });
    }
  }
};
