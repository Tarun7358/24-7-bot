const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

function parseDuration(str) {
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  const suffix = str.replace(/[0-9.]/g, '').toLowerCase();
  if (suffix === 's') return num * 1000;
  if (suffix === 'm') return num * 60 * 1000;
  if (suffix === 'h') return num * 60 * 60 * 1000;
  if (suffix === 'd') return num * 24 * 60 * 60 * 1000;
  return num * 60 * 1000; // Default to minutes
}

module.exports = {
  name: 'giveaway',
  description: 'Start a server giveaway',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const durationStr = args[0];
    const winnersCount = parseInt(args[1]) || 1;
    const prize = args.slice(2).join(' ');

    if (!durationStr || !prize) {
      return message.reply({ content: 'Usage: !giveaway [duration: 10m/1h/1d] [winnersCount] [prize]' });
    }

    const ms = parseDuration(durationStr);
    if (!ms || ms <= 0) return message.reply({ content: 'Invalid duration specified.' });

    const endsAt = Date.now() + ms;

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `🎉 **XTREMEZ GIVEAWAY** 🎉`,
        ``,
        `• **Prize:** \`${prize}\``,
        `• **Winners:** \`${winnersCount}\``,
        `• **Ends:** <t:${Math.floor(endsAt / 1000)}:F> (<t:${Math.floor(endsAt / 1000)}:R>)`,
        `• **Hosted by:** ${message.author.toString()}`,
        ``,
        `*React with 🎉 to participate!*`
      ].join('\n'))
      .setTimestamp();

    try {
      const msg = await message.channel.send({ embeds: [embed] });
      await msg.react('🎉');

      db.addGiveaway(msg.id, message.channel.id, prize, winnersCount, endsAt);
      message.reply({ content: '✅ Giveaway started!' });
    } catch (err) {
      message.reply({ content: `Failed to start giveaway: ${err.message}` });
    }
  },

  slashData: {
    name: 'giveaway',
    description: 'Start a server giveaway',
    default_member_permissions: String(PermissionFlagsBits.ManageGuild),
    options: [
      {
        name: 'duration',
        description: 'Duration (e.g. 10m, 2h, 1d)',
        type: 3,
        required: true
      },
      {
        name: 'winners',
        description: 'Number of winners',
        type: 4,
        required: true
      },
      {
        name: 'prize',
        description: 'What is being given away',
        type: 3,
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const durationStr = interaction.options.getString('duration');
    const winnersCount = interaction.options.getInteger('winners');
    const prize = interaction.options.getString('prize');

    const ms = parseDuration(durationStr);
    if (!ms || ms <= 0) return interaction.reply({ content: 'Invalid duration specified.', ephemeral: true });

    const endsAt = Date.now() + ms;

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `🎉 **XTREMEZ GIVEAWAY** 🎉`,
        ``,
        `• **Prize:** \`${prize}\``,
        `• **Winners:** \`${winnersCount}\``,
        `• **Ends:** <t:${Math.floor(endsAt / 1000)}:F> (<t:${Math.floor(endsAt / 1000)}:R>)`,
        `• **Hosted by:** ${interaction.user.toString()}`,
        ``,
        `*React with 🎉 to participate!*`
      ].join('\n'))
      .setTimestamp();

    try {
      await interaction.deferReply({ ephemeral: true });
      const msg = await interaction.channel.send({ embeds: [embed] });
      await msg.react('🎉');

      db.addGiveaway(msg.id, interaction.channel.id, prize, winnersCount, endsAt);
      await interaction.editReply({ content: '✅ Giveaway started!' });
    } catch (err) {
      await interaction.editReply({ content: `Failed to start giveaway: ${err.message}` });
    }
  }
};
