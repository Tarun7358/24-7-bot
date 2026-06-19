const { EmbedBuilder } = require('discord.js');
const db = require('./db');

module.exports = {
  async drawGiveaway(client, gw) {
    if (!gw || gw.ended) return;

    db.endGiveaway(gw.messageId);

    try {
      const channel = await client.channels.fetch(gw.channelId).catch(() => null);
      if (!channel) return;

      const msg = await channel.messages.fetch(gw.messageId).catch(() => null);
      if (!msg) return;

      const reaction = msg.reactions.cache.get('🎉');
      let participants = [];
      if (reaction) {
        // Fetch all users who reacted
        let usersCollection = await reaction.users.fetch();
        participants = usersCollection.filter(u => !u.bot).map(u => u.id);
      }

      const winners = [];
      const winnersCount = gw.winnersCount;

      for (let i = 0; i < winnersCount && participants.length > 0; i++) {
        const index = Math.floor(Math.random() * participants.length);
        winners.push(participants.splice(index, 1)[0]);
      }

      const winnerMentions = winners.map(wId => `<@${wId}>`).join(', ');

      const endEmbed = new EmbedBuilder()
        .setColor('#888888')
        .setDescription([
          `🎉 **GIVEAWAY ENDED** 🎉`,
          ``,
          `• **Prize:** \`${gw.prize}\``,
          `• **Winners:** ${winnerMentions || '*No participants/winners.*'}`,
          `• **Ended:** <t:${Math.floor(Date.now() / 1000)}:R>`
        ].join('\n'))
        .setTimestamp();

      await msg.edit({ embeds: [endEmbed] });

      if (winners.length > 0) {
        channel.send(`🎉 Congratulations ${winnerMentions}! You won the giveaway for **${gw.prize}**!`);
      } else {
        channel.send(`😭 No one joined the giveaway for **${gw.prize}**, so there are no winners.`);
      }
    } catch (err) {
      console.error('[GIVEAWAY DRAW ERROR]', err);
    }
  }
};
