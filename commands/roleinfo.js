const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'roleinfo',
  description: 'Display details about a role',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const role = message.mentions.roles.first();
    if (!role) return message.reply({ content: 'Please mention a role.' });

    const createdTimestamp = Math.floor(role.createdTimestamp / 1000);
    const membersCount = role.members.size;

    const embed = new EmbedBuilder()
      .setColor(role.hexColor || '#FFFFFF')
      .setDescription([
        `🎭 **ROLE DETAILS: ${role.name}**`,
        `• **Role ID:** \`${role.id}\``,
        `• **Hex Color:** \`${role.hexColor}\``,
        `• **Members Assigned:** \`${membersCount}\``,
        `• **Position (Hierarchy):** \`${role.position}\``,
        `• **Mentionable:** \`${role.mentionable ? 'Yes' : 'No'}\``,
        `• **Hoisted (Separate):** \`${role.hoist ? 'Yes' : 'No'}\``,
        `• **Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
      ].join('\n'))
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },

  slashData: {
    name: 'roleinfo',
    description: 'Display details about a role',
    options: [
      {
        name: 'role',
        description: 'The role to view',
        type: 8, // ROLE
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const role = interaction.options.getRole('role');

    const createdTimestamp = Math.floor(role.createdTimestamp / 1000);
    const membersCount = role.members.size;

    const embed = new EmbedBuilder()
      .setColor(role.hexColor || '#FFFFFF')
      .setDescription([
        `🎭 **ROLE DETAILS: ${role.name}**`,
        `• **Role ID:** \`${role.id}\``,
        `• **Hex Color:** \`${role.hexColor}\``,
        `• **Members Assigned:** \`${membersCount}\``,
        `• **Position (Hierarchy):** \`${role.position}\``,
        `• **Mentionable:** \`${role.mentionable ? 'Yes' : 'No'}\``,
        `• **Hoisted (Separate):** \`${role.hoist ? 'Yes' : 'No'}\``,
        `• **Created:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`
      ].join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
