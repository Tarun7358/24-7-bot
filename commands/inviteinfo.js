const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'inviteinfo',
  description: 'Inspect details about a server invite code',
  
  async execute(message, args, client) {
    const inviteUrl = args[0];
    if (!inviteUrl) return message.reply({ content: 'Please provide an invite link or code.' });

    // Extract code
    const code = inviteUrl.split('/').pop();

    try {
      const invite = await client.fetchInvite(code);

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `🔗 **INVITE SPECIFICATIONS: ${invite.code}**`,
          `• **Guild Name:** \`${invite.guild ? invite.guild.name : 'Unknown'}\` (ID: \`${invite.guild ? invite.guild.id : 'Unknown'}\`)`,
          `• **Channel:** \`${invite.channel ? invite.channel.name : 'Unknown'}\` (${invite.channel ? invite.channel.type : ''})`,
          `• **Inviter:** ${invite.inviter ? invite.inviter.tag : '`System`'}`,
          `• **Member Count:** \`${invite.memberCount || 'Unknown'}\` (Online: \`${invite.presenceCount || 'Unknown'}\`)`,
          `• **Expires:** ${invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : '`Never`'}`,
          `• **Temporary:** \`${invite.temporary ? 'Yes' : 'No'}\``
        ].join('\n'))
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply({ content: `Failed to retrieve invite: ${err.message}` });
    }
  },

  slashData: {
    name: 'inviteinfo',
    description: 'Inspect details about a server invite code',
    options: [
      {
        name: 'invite',
        description: 'The invite link or code (e.g. discord.gg/abc)',
        type: 3,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    const inviteUrl = interaction.options.getString('invite');
    const code = inviteUrl.split('/').pop();

    try {
      const invite = await client.fetchInvite(code);

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `🔗 **INVITE SPECIFICATIONS: ${invite.code}**`,
          `• **Guild Name:** \`${invite.guild ? invite.guild.name : 'Unknown'}\` (ID: \`${invite.guild ? invite.guild.id : 'Unknown'}\`)`,
          `• **Channel:** \`${invite.channel ? invite.channel.name : 'Unknown'}\` (${invite.channel ? invite.channel.type : ''})`,
          `• **Inviter:** ${invite.inviter ? invite.inviter.tag : '`System`'}`,
          `• **Member Count:** \`${invite.memberCount || 'Unknown'}\` (Online: \`${invite.presenceCount || 'Unknown'}\`)`,
          `• **Expires:** ${invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : '`Never`'}`,
          `• **Temporary:** \`${invite.temporary ? 'Yes' : 'No'}\``
        ].join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `Failed to retrieve invite: ${err.message}`, ephemeral: true });
    }
  }
};
