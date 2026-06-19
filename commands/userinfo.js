const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');

async function generateUserInfoEmbed(member) {
  const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
  const joinedTimestamp = Math.floor(member.joinedTimestamp / 1000);
  
  const warnings = db.getWarnings(member.id);
  const rolesList = member.roles.cache
    .filter(r => r.name !== '@everyone')
    .map(r => r.toString())
    .join(', ') || '*None*';

  const text = [
    `👤 **USER SPECIFICATIONS**`,
    `• **Tag:** ${member.user.tag} (${member.toString()})`,
    `• **User ID:** \`${member.id}\``,
    `• **Account Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`,
    `• **Joined Guild:** <t:${joinedTimestamp}:F> (<t:${joinedTimestamp}:R>)`,
    `• **Warnings Issued:** \`${warnings.length}\``,
    ``,
    `🎭 **ROLES**`,
    rolesList
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(text)
    .setTimestamp();
}

module.exports = {
  name: 'userinfo',
  description: 'Display detailed specs about a member',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const targetMember = message.mentions.members.first() || message.member;
    try {
      const embed = await generateUserInfoEmbed(targetMember);
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Userinfo command: ${err.message}`);
    }
  },

  slashData: {
    name: 'userinfo',
    description: 'Display detailed specs about a member',
    options: [
      {
        name: 'user',
        description: 'The member to query',
        type: 6,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.reply({ content: 'Member not found in this guild.', ephemeral: true });

    try {
      const embed = await generateUserInfoEmbed(targetMember);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.log(`[ERROR] Userinfo slash command: ${err.message}`);
    }
  }
};
