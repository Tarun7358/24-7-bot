const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

async function generateActivityEmbed(guild) {
  const data = db.getDb();

  // Find most active user
  let activeUser = 'None';
  let maxUserMsg = 0;
  if (data.stats.messageCounts) {
    for (const [userId, count] of Object.entries(data.stats.messageCounts)) {
      if (count > maxUserMsg) {
        maxUserMsg = count;
        activeUser = `<@${userId}> (\`${count}\` messages)`;
      }
    }
  }

  // Find most active channel
  let activeChannel = 'None';
  let maxChanMsg = 0;
  if (data.stats.channelCounts) {
    for (const [chanId, count] of Object.entries(data.stats.channelCounts)) {
      if (count > maxChanMsg) {
        maxChanMsg = count;
        activeChannel = `<#${chanId}> (\`${count}\` messages)`;
      }
    }
  }

  // Voice participant count
  let voiceParticipants = 0;
  guild.voiceStates.cache.forEach(vs => {
    if (vs.channelId && !vs.member.user.bot) {
      voiceParticipants++;
    }
  });

  // Voice hours calculation
  let totalVoiceSeconds = 0;
  if (data.stats.voiceSeconds) {
    for (const seconds of Object.values(data.stats.voiceSeconds)) {
      totalVoiceSeconds += seconds;
    }
  }
  const voiceHours = (totalVoiceSeconds / 3600).toFixed(2);

  const text = [
    `╔════════════════════╗`,
    `║  XTREMEZ ACTIVITY  ║`,
    `╚════════════════════╝`,
    ``,
    `📝 **MESSAGE ACTIVITY**`,
    `• Messages Today: \`${data.stats.messagesToday}\``,
    `• Messages This Week: \`${data.stats.messagesThisWeek}\``,
    `• Most Active User: ${activeUser}`,
    `• Most Active Channel: ${activeChannel}`,
    ``,
    `🎤 **VOICE TELEMETRY**`,
    `• Current Voice Participants: \`${voiceParticipants}\``,
    `• Total Recorded Voice Hours: \`${voiceHours} hrs\` (This Week)`
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription(text)
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Activity Statistics • Live Telemetry' });
}

module.exports = {
  name: 'activity',
  description: 'Display XTREMEZ message and voice activity metrics',

  async execute(message, args, client) {
    if (!message.guild) return;
    try {
      const embed = await generateActivityEmbed(message.guild);
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Activity command: ${err.message}`);
    }
  },

  slashData: {
    name: 'activity',
    description: 'Display XTREMEZ message and voice activity metrics'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    try {
      const embed = await generateActivityEmbed(interaction.guild);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Activity slash command: ${err.message}`);
    }
  }
};
