const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

async function generateMemberStatsEmbed(guild) {
  const data = db.getDb();
  
  const total = guild.memberCount;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const humans = total - bots;

  let online = 0;
  let idle = 0;
  let dnd = 0;
  
  guild.members.cache.forEach(m => {
    if (m.presence) {
      if (m.presence.status === 'online') online++;
      else if (m.presence.status === 'idle') idle++;
      else if (m.presence.status === 'dnd') dnd++;
    }
  });

  const offline = total - (online + idle + dnd);

  const text = [
    `╔════════════════════╗`,
    `║  XTREMEZ MEMBERS   ║`,
    `╚════════════════════╝`,
    ``,
    `👥 **MEMBERSHIP BREAKDOWN**`,
    `• Total Guild Members: \`${total}\``,
    `• Human Users: \`${humans}\` (${Math.round((humans / total) * 100)}%)`,
    `• Bot Accounts: \`${bots}\` (${Math.round((bots / total) * 100)}%)`,
    ``,
    `🟢 **PRESENCE STATES**`,
    `• Online: \`${online}\``,
    `• Idle / Away: \`${idle}\``,
    `• Do Not Disturb: \`${dnd}\``,
    `• Offline / Invisible: \`${offline}\``,
    ``,
    `📈 **MEMBERSHIP VELOCITY**`,
    `• Joins Today: \`${data.stats.joinsToday}\``,
    `• Joins This Week: \`${data.stats.joinsThisWeek}\``,
    `• Leaves Today: \`${data.stats.leavesToday}\``,
    `• Leaves This Week: \`${data.stats.leavesThisWeek}\``
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription(text)
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Member Stats • Live Tracking' });
}

module.exports = {
  name: 'memberstats',
  description: 'Display XTREMEZ detailed server membership statistics',

  async execute(message, args, client) {
    if (!message.guild) return;
    try {
      const embed = await generateMemberStatsEmbed(message.guild);
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Memberstats command: ${err.message}`);
    }
  },

  slashData: {
    name: 'memberstats',
    description: 'Display XTREMEZ detailed server membership statistics'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    try {
      const embed = await generateMemberStatsEmbed(interaction.guild);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Memberstats slash command: ${err.message}`);
    }
  }
};
