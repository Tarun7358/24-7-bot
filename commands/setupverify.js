const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'setupverify',
  description: 'Setup the button verification system in a channel',
  
  async execute(message, args, client) {
    if (!message.guild || !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ content: 'You do not have permission to use this command.' }).catch(() => {});
    }

    const channel = message.mentions.channels.first() || message.channel;
    const role = message.mentions.roles.first();
    if (!role) return message.reply({ content: 'Please mention a role to assign upon verification.' });

    const requiredAge = parseInt(args[2]) || 0;

    try {
      const data = db.getDb();
      data.verification.roleId = role.id;
      data.verification.channelId = channel.id;
      data.verification.requiredAgeDays = requiredAge;
      db.saveDb();

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `╔════════════════════╗`,
          `║ XTREMEZ VERIFICATION║`,
          `╚════════════════════╝`,
          ``,
          `Welcome to **${message.guild.name}**. To gain full access to the server and protect against automated bot raids, please verify your identity below.`,
          ``,
          `🛡️ **POLICIES & REQUIREMENTS**`,
          `• By verifying, you agree to follow all server guidelines.`,
          `• Account Age Minimum Requirement: \`${requiredAge} days\`.`,
          `• Suspicious accounts (e.g. no avatar, brand new) are auto-flagged.`
        ].join('\n'))
        .setTimestamp()
        .setFooter({ text: 'XTREMEZ Gatekeeper Security' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('xtremez_verify_btn')
          .setLabel('Verify Identity')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🛡️')
      );

      await channel.send({ embeds: [embed], components: [row] });
      message.reply({ content: `✅ Verification system setup successfully in ${channel.toString()} (Role: \`${role.name}\`).` });
    } catch (err) {
      message.reply({ content: `Failed to setup verification: ${err.message}` });
    }
  },

  slashData: {
    name: 'setupverify',
    description: 'Setup the button verification system in a channel',
    default_member_permissions: String(PermissionFlagsBits.Administrator),
    options: [
      {
        name: 'channel',
        description: 'The channel to send the verification message to',
        type: 7, // CHANNEL
        required: true
      },
      {
        name: 'role',
        description: 'The role to assign to verified users',
        type: 8, // ROLE
        required: true
      },
      {
        name: 'required_age_days',
        description: 'Minimum account age in days required to verify',
        type: 4, // INTEGER
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild || !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const requiredAge = interaction.options.getInteger('required_age_days') || 0;

    try {
      const data = db.getDb();
      data.verification.roleId = role.id;
      data.verification.channelId = channel.id;
      data.verification.requiredAgeDays = requiredAge;
      db.saveDb();

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `╔════════════════════╗`,
          `║ XTREMEZ VERIFICATION║`,
          `╚════════════════════╝`,
          ``,
          `Welcome to **${interaction.guild.name}**. To gain full access to the server and protect against automated bot raids, please verify your identity below.`,
          ``,
          `🛡️ **POLICIES & REQUIREMENTS**`,
          `• By verifying, you agree to follow all server guidelines.`,
          `• Account Age Minimum Requirement: \`${requiredAge} days\`.`,
          `• Suspicious accounts (e.g. no avatar, brand new) are auto-flagged.`
        ].join('\n'))
        .setTimestamp()
        .setFooter({ text: 'XTREMEZ Gatekeeper Security' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('xtremez_verify_btn')
          .setLabel('Verify Identity')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🛡️')
      );

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Verification system setup successfully in ${channel.toString()} (Role: \`${role.name}\`).`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `Failed to setup verification: ${err.message}`, ephemeral: true });
    }
  }
};
