const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'botsecurity',
  description: 'Inspect the security rating and admin permissions of all bots',
  
  async execute(message, args, client) {
    if (!message.guild) return;

    const bots = message.guild.members.cache.filter(m => m.user.bot);
    if (bots.size === 0) return message.reply({ content: 'No bots found in this server.' });

    const embed = this.buildTelemetry(message.guild, bots);
    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'botsecurity',
    description: 'Inspect the security rating and admin permissions of all bots'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;

    const bots = interaction.guild.members.cache.filter(m => m.user.bot);
    if (bots.size === 0) return interaction.reply({ content: 'No bots found in this server.', ephemeral: true });

    const embed = this.buildTelemetry(interaction.guild, bots);
    await interaction.reply({ embeds: [embed] });
  },

  buildTelemetry(guild, bots) {
    const adminBots = bots.filter(m => m.permissions.has(PermissionFlagsBits.Administrator));
    const lines = [];

    lines.push(`╔══════════════════════════════════════════════╗`);
    lines.push(`║           BOT SECURITY TELEMETRY             ║`);
    lines.push(`╚══════════════════════════════════════════════╝`);
    lines.push(``);

    bots.forEach(bot => {
      const hasAdmin = bot.permissions.has(PermissionFlagsBits.Administrator);
      const isDangerous = bot.permissions.has([
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageWebhooks
      ]);

      const risk = hasAdmin ? 'HIGH' : isDangerous ? 'MEDIUM' : 'LOW';
      const adminStr = hasAdmin ? 'YES' : 'NO ';

      // Pad bot name to 20 chars
      const name = bot.user.username.substring(0, 18).padEnd(18, ' ');
      lines.push(`• ${name} | Admin: ${adminStr} | Risk: [${risk}]`);
    });

    return new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `\`\`\`\n${lines.join('\n')}\n\`\`\``,
        ``,
        `📊 **TELEMETRY SUMMARY**`,
        `• **Total Bots:** \`${bots.size}\``,
        `• **Bots with Administrator:** \`${adminBots.size}\``,
        `• **Security Level:** \`${adminBots.size > 2 ? 'CAUTION' : 'OPTIMAL'}\``
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'XTREMEZ Bot Security Watchdog' });
  }
};
