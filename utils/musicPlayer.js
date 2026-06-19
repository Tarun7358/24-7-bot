const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

class MusicPlayer {
  constructor(guild, channel) {
    this.guild = guild;
    this.channel = channel;
    this.queue = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    this.connection.subscribe(this.player);

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });

    this.player.on('error', error => {
      console.error('[MUSIC ERROR]', error);
      this.playNext();
    });
  }

  async addSong(query) {
    let songInfo = null;

    try {
      if (query.startsWith('http') && (query.includes('youtube.com') || query.includes('youtu.be'))) {
        const info = await play.video_info(query);
        songInfo = {
          title: info.video_details.title,
          url: info.video_details.url,
          duration: info.video_details.durationRaw || 'Unknown',
          thumbnail: info.video_details.thumbnails[0]?.url || '',
        };
      } else if (query.startsWith('http') && query.includes('spotify.com')) {
        const spData = await play.spotify(query);
        const searchResult = await play.search(`${spData.name} ${spData.artists[0]?.name || ''}`, { limit: 1 });
        if (searchResult.length > 0) {
          songInfo = {
            title: spData.name,
            url: searchResult[0].url,
            duration: searchResult[0].durationRaw || 'Unknown',
            thumbnail: searchResult[0].thumbnails[0]?.url || '',
          };
        }
      } else {
        const searchResult = await play.search(query, { limit: 1 });
        if (searchResult.length > 0) {
          songInfo = {
            title: searchResult[0].title,
            url: searchResult[0].url,
            duration: searchResult[0].durationRaw || 'Unknown',
            thumbnail: searchResult[0].thumbnails[0]?.url || '',
          };
        }
      }
    } catch (e) {
      console.error('[MUSIC FETCH ERROR]', e);
    }

    if (songInfo) {
      this.queue.push(songInfo);
      if (!this.isPlaying) {
        await this.playNext();
      }
      return songInfo;
    }
    return null;
  }

  async playNext() {
    if (this.queue.length === 0 || this.currentIndex >= this.queue.length) {
      this.isPlaying = false;
      this.player.stop();
      return;
    }

    const song = this.queue[this.currentIndex];
    try {
      const stream = await play.stream(song.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      this.player.play(resource);
      this.isPlaying = true;
      this.currentIndex++;
    } catch (err) {
      console.error('[PLAY NEXT ERROR]', err);
      this.currentIndex++;
      await this.playNext();
    }
  }

  skip() {
    this.playNext();
  }

  pause() {
    this.player.pause();
  }

  resume() {
    this.player.unpause();
  }

  stop() {
    this.queue = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.player.stop();
    try {
      this.connection.destroy();
    } catch (e) {}
  }
}

module.exports = MusicPlayer;
