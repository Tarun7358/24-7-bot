const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'approve',
  description: 'Approve a server suggestion by ID',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const id = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!id) return message.reply({ content: 'Please specify the suggestion ID.' });

    const sug = db.updateSuggestion(id, 'APPROVED', message.author.tag, reason);
    if (!sug) return message.reply({ content: 'Suggestion not found.' });

    try {
      const channel = await message.guild.channels.fetch(sug.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(sug.messageId).catch(() => null);
        if (msg) {
          const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setDescription([
              `╔════════════════════╗`,
              `║ SUGGESTION APPROVED║`,
              `╚════════════════════╝`,
              ``,
              `• **Suggestion ID:** \`${sug.id}\``,
              `• **Author:** ${sug.authorTag}`,
              `• **Status:** 🟢 Approved by ${message.author.tag}`,
              `• **Reason:** \`${reason}\``,
              ``,
              `**Suggestion:**`,
              `\`\`\`\n${sug.text}\n\`\`\``
            ].join('\n'))
            .setTimestamp();
          await msg.edit({ embeds: [embed] });
        }
      }
      message.reply({ content: `✅ Suggestion \`${id}\` has been approved.` });
    } catch (err) {
      message.reply({ content: `Failed to approve suggestion: ${err.message}` });
    }
  },

  slashData: {
    name: 'approve',
    description: 'Approve a server suggestion by ID',
    default_member_permissions: String(PermissionFlagsBits.ManageGuild),
    options: [
      {
        name: 'id',
        description: 'The suggestion ID',
        type: 3,
        required: true
      },
      {
        name: 'reason',
        description: 'Reason for approval',
        type: 3,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const id = interaction.options.getString('id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const sug = db.updateSuggestion(id, 'APPROVED', interaction.user.tag, reason);
    if (!sug) return interaction.reply({ content: 'Suggestion not found.', ephemeral: true });

    try {
      await interaction.deferReply({ ephemeral: true });
      const channel = await interaction.guild.channels.fetch(sug.channelId).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(sug.messageId).catch(() => null);
        if (msg) {
          const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setDescription([
              `╔════════════════════╗`,
              `║ SUGGESTION APPROVED║`,
              `╚════════════════════╝`,
              ``,
              `• **Suggestion ID:** \`${sug.id}\``,
              `• **Author:** ${sug.authorTag}`,
              `• **Status:** 🟢 Approved by ${interaction.user.tag}`,
              `• **Reason:** \`${reason}\``,
              ``,
              `**Suggestion:**`,
              `\`\`\`\n${sug.text}\n\`\`\``
            ].join('\n'))
            .setTimestamp();
          await msg.edit({ embeds: [embed] });
        }
      }
      await interaction.editReply({ content: `✅ Suggestion \`${id}\` has been approved.` });
    } catch (err) {
      await interaction.editReply({ content: `Failed to approve suggestion: ${err.message}` });
    }
  }
};
