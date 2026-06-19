const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'channelinfo',
  description: 'Display details about a channel',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const channel = message.mentions.channels.first() || message.channel;

    const createdTimestamp = Math.floor(channel.createdTimestamp / 1000);

    const typeNames = {
      [ChannelType.GuildText]: 'Text Channel',
      [ChannelType.GuildVoice]: 'Voice Channel',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildAnnouncement]: 'Announcement Channel',
      [ChannelType.GuildStageVoice]: 'Stage Voice Channel'
    };
    const typeString = typeNames[channel.type] || 'Unknown';

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `📁 **CHANNEL DETAILS: #${channel.name}**`,
        `• **Channel ID:** \`${channel.id}\``,
        `• **Type:** \`${typeString}\``,
        `• **Topic:** \`${channel.topic || 'No topic configured'}\``,
        `• **Parent Category:** ${channel.parent ? channel.parent.name : '`None`'}`,
        `• **Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
      ].join('\n'))
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'channelinfo',
    description: 'Display details about a channel',
    options: [
      {
        name: 'channel',
        description: 'The channel to view',
        type: 7, // CHANNEL
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const createdTimestamp = Math.floor(channel.createdTimestamp / 1000);

    const typeNames = {
      [ChannelType.GuildText]: 'Text Channel',
      [ChannelType.GuildVoice]: 'Voice Channel',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildAnnouncement]: 'Announcement Channel',
      [ChannelType.GuildStageVoice]: 'Stage Voice Channel'
    };
    const typeString = typeNames[channel.type] || 'Unknown';

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `📁 **CHANNEL DETAILS: #${channel.name}**`,
        `• **Channel ID:** \`${channel.id}\``,
        `• **Type:** \`${typeString}\``,
        `• **Topic:** \`${channel.topic || 'No topic configured'}\``,
        `• **Parent Category:** ${channel.parent ? channel.parent.name : '`None`'}`,
        `• **Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
      ].join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
