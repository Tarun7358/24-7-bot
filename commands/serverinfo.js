const { EmbedBuilder, ChannelType } = require('discord.js');

async function generateServerInfoEmbed(guild) {
  let ownerTag = 'Unknown';
  try {
    const owner = await guild.fetchOwner();
    ownerTag = `${owner.user.tag} (${owner.toString()})`;
  } catch (err) {
    ownerTag = `ID: ${guild.ownerId}`;
  }

  const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
  const creationDateString = `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)\n`;

  const totalChannels = guild.channels.cache.size;
  const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;

  const verificationLevels = {
    0: 'NONE (Unrestricted)',
    1: 'LOW (Verified Email)',
    2: 'MEDIUM (Registered for >5 mins)',
    3: 'HIGH (Member for >10 mins)',
    4: 'VERY_HIGH (Verified Phone)'
  };
  const verificationString = verificationLevels[guild.verificationLevel] || 'Unknown';

  const text = [
    `╔════════════════════╗`,
    `║  XTREMEZ SERVER    ║`,
    `╚════════════════════╝`,
    ``,
    `🖥️ **IDENTITY & CONFIGURATION**`,
    `• **Name:** ${guild.name}`,
    `• **ID:** \`${guild.id}\``,
    `• **Owner:** ${ownerTag}`,
    `• **Verification Level:** \`${verificationString}\``,
    `• **Created:** ${creationDateString}`,
    `📁 **ASSET INVENTORY**`,
    `• **Roles:** \`${guild.roles.cache.size}\``,
    `• **Total Channels:** \`${totalChannels}\` (Categories: \`${categories}\`, Text: \`${textChannels}\`, Voice: \`${voiceChannels}\`)`,
    `• **Custom Emojis:** \`${guild.emojis.cache.size}\``,
    `• **Custom Stickers:** \`${guild.stickers.cache.size}\``
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription(text)
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Server Info • Live Audit' });
}

module.exports = {
  name: 'serverinfo',
  description: 'Display detailed specifications about this guild',

  async execute(message, args, client) {
    if (!message.guild) return;
    try {
      const embed = await generateServerInfoEmbed(message.guild);
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Serverinfo command: ${err.message}`);
    }
  },

  slashData: {
    name: 'serverinfo',
    description: 'Display detailed specifications about this guild'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    try {
      const embed = await generateServerInfoEmbed(interaction.guild);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Serverinfo slash command: ${err.message}`);
    }
  }
};
