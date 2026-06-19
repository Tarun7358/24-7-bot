const { EmbedBuilder } = require('discord.js');

module.exports = {
  async log(guild, type, details, targetChannelName = 'security-logs') {
    if (!guild) return;

    let logChannel = guild.channels.cache.find(c => c.name === targetChannelName);
    if (!logChannel) {
      logChannel = guild.channels.cache.find(c => c.name === 'security-logs' || c.name === 'logs');
    }

    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `🛡️ **XTREMEZ SECURITY CENTER**`,
        `• **Event:** \`${type}\``,
        `• **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:f>`,
        ``,
        details
      ].join('\n'))
      .setTimestamp();

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      // Fail silently
    }
  }
};
