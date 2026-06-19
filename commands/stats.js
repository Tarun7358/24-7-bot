const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

async function generateStatsEmbed(guild) {
  const data = db.getDb();
  
  const total = guild.memberCount;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const humans = total - bots;

  // Active presences
  let online = 0;
  try {
    online = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;
  } catch (e) {}
  const offline = total - online;

  const boosts = guild.premiumSubscriptionCount || 0;
  
  const text = [
    `╔════════════════════╗`,
    `║  XTREMEZ STATS     ║`,
    `╚════════════════════╝`,
    ``,
    `📈 **MEMBER STATISTICS**`,
    `• Total Members: \`${total}\``,
    `• Humans: \`${humans}\` | Bots: \`${bots}\``,
    `• Online: \`${online}\` | Offline: \`${offline}\``,
    `• Joins Today: \`${data.stats.joinsToday}\` | This Week: \`${data.stats.joinsThisWeek}\``,
    `• Leaves Today: \`${data.stats.leavesToday}\` | This Week: \`${data.stats.leavesThisWeek}\``,
    ``,
    `🚀 **BOOST CONFIGURATION**`,
    `• Total Boosts: \`${boosts}\` (Tier \`${guild.premiumTier}\`)`,
    ``,
    `📂 **SERVER ASSETS**`,
    `• Channels: \`${guild.channels.cache.size}\` | Roles: \`${guild.roles.cache.size}\``,
    `• Emojis: \`${guild.emojis.cache.size}\` | Stickers: \`${guild.stickers.cache.size}\``
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription(text)
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Stats Center • Live Updates' });
}

module.exports = {
  name: 'stats',
  description: 'Display XTREMEZ Server Statistics overview',

  async execute(message, args, client) {
    if (!message.guild) return;
    try {
      const embed = await generateStatsEmbed(message.guild);
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Stats command: ${err.message}`);
    }
  },

  slashData: {
    name: 'stats',
    description: 'Display XTREMEZ Server Statistics overview'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    try {
      const embed = await generateStatsEmbed(interaction.guild);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Stats slash command: ${err.message}`);
    }
  }
};
