const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'unwarn',
  description: 'View or remove warnings from a user',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply({ content: 'Please mention a valid user.' });

    const warnings = db.getWarnings(targetUser.id);
    if (warnings.length === 0) {
      return message.reply({ content: `✅ **${targetUser.tag}** has no active warnings.` });
    }

    const indexArg = args[1];
    if (indexArg === undefined) {
      // List warnings
      const list = warnings.map((w, idx) => {
        return `\`[Index: ${idx + 1}]\` Warned by: \`${w.moderator}\` on <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:d> - Reason: \`${w.reason}\``;
      }).join('\n');
      return message.reply({ content: `⚠️ **Warnings for ${targetUser.tag}:**\n${list}\n\n*Use !unwarn @user [index] to remove.*` });
    }

    const index = parseInt(indexArg) - 1;
    if (isNaN(index) || index < 0 || index >= warnings.length) {
      return message.reply({ content: 'Invalid warning index.' });
    }

    try {
      const removed = db.unwarnUser(targetUser.id, index);
      db.addModerationLog('UNWARN', targetUser.tag, message.author.tag, `Removed warning: ${removed.reason}`);
      message.reply({ content: `✅ Removed warning index \`${index + 1}\` from **${targetUser.tag}**.` });
    } catch (err) {
      message.reply({ content: `Failed to remove warning: ${err.message}` });
    }
  },

  slashData: {
    name: 'unwarn',
    description: 'View or remove warnings from a user',
    default_member_permissions: String(PermissionFlagsBits.ModerateMembers),
    options: [
      {
        name: 'user',
        description: 'The user to query or unwarn',
        type: 6,
        required: true
      },
      {
        name: 'index',
        description: 'Warning index to remove (1-based)',
        type: 4, // INTEGER
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const indexArg = interaction.options.getInteger('index');

    const warnings = db.getWarnings(targetUser.id);
    if (warnings.length === 0) {
      return interaction.reply({ content: `✅ **${targetUser.tag}** has no active warnings.` });
    }

    if (indexArg === null) {
      // List warnings
      const list = warnings.map((w, idx) => {
        return `\`[Index: ${idx + 1}]\` Warned by: \`${w.moderator}\` on <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:d> - Reason: \`${w.reason}\``;
      }).join('\n');
      return interaction.reply({ content: `⚠️ **Warnings for ${targetUser.tag}:**\n${list}\n\n*Use /unwarn user [index] to remove.*` });
    }

    const index = indexArg - 1;
    if (index < 0 || index >= warnings.length) {
      return interaction.reply({ content: 'Invalid warning index.', ephemeral: true });
    }

    try {
      const removed = db.unwarnUser(targetUser.id, index);
      db.addModerationLog('UNWARN', targetUser.tag, interaction.user.tag, `Removed warning: ${removed.reason}`);
      await interaction.reply({ content: `✅ Removed warning index \`${indexArg}\` from **${targetUser.tag}**.` });
    } catch (err) {
      await interaction.reply({ content: `Failed to remove warning: ${err.message}`, ephemeral: true });
    }
  }
};
