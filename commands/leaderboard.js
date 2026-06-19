const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

async function generateLeaderboardEmbed(guild) {
  const data = db.getDb();
  
  let leaderboardEntries = [];
  if (data.stats.messageCounts) {
    leaderboardEntries = Object.entries(data.stats.messageCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  const list = leaderboardEntries.map((entry, index) => {
    return `${index + 1}. <@${entry.userId}> - \`${entry.count}\` messages`;
  }).join('\n') || '*No message activity recorded yet.*';

  const text = [
    `╔════════════════════╗`,
    `║ XTREMEZ LEADERBOARD║`,
    `╚════════════════════╝`,
    ``,
    `🏆 **TOP 10 ACTIVE MEMBERS (Weekly)**`,
    list
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription(text)
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Activity Leaderboard' });
}

module.exports = {
  name: 'leaderboard',
  description: 'Display top active users by message volume',

  async execute(message, args, client) {
    if (!message.guild) return;
    try {
      const embed = await generateLeaderboardEmbed(message.guild);
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Leaderboard command: ${err.message}`);
    }
  },

  slashData: {
    name: 'leaderboard',
    description: 'Display top active users by message volume'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    try {
      const embed = await generateLeaderboardEmbed(interaction.guild);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Leaderboard slash command: ${err.message}`);
    }
  }
};
