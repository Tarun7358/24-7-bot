module.exports = {
  name: 'server',
  description: 'Display details about this server',
  
  async execute(message, args, client) {
    if (!message.guild) {
      return message.reply({ content: 'This command can only be used inside a server.' }).catch(() => {});
    }

    try {
      let ownerTag = 'Unknown';
      try {
        const owner = await message.guild.fetchOwner();
        ownerTag = `${owner.user.tag} (${owner.toString()})`;
      } catch (err) {
        ownerTag = `ID: ${message.guild.ownerId}`;
      }

      const createdTimestamp = Math.floor(message.guild.createdTimestamp / 1000);
      const creationDateString = `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`;

      const serverInfo = [
        `🖥️ **Server Details**`,
        `• **Server Name:** ${message.guild.name}`,
        `• **Owner:** ${ownerTag}`,
        `• **Members:** ${message.guild.memberCount}`,
        `• **Created On:** ${creationDateString}`
      ].join('\n');

      await message.reply({ content: serverInfo });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in server command: ${err.message}`);
    }
  },

  slashData: {
    name: 'server',
    description: 'Display details about this server'
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true }).catch(() => {});
    }

    try {
      let ownerTag = 'Unknown';
      try {
        const owner = await interaction.guild.fetchOwner();
        ownerTag = `${owner.user.tag} (${owner.toString()})`;
      } catch (err) {
        ownerTag = `ID: ${interaction.guild.ownerId}`;
      }

      const createdTimestamp = Math.floor(interaction.guild.createdTimestamp / 1000);
      const creationDateString = `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`;

      const serverInfo = [
        `🖥️ **Server Details**`,
        `• **Server Name:** ${interaction.guild.name}`,
        `• **Owner:** ${ownerTag}`,
        `• **Members:** ${interaction.guild.memberCount}`,
        `• **Created On:** ${creationDateString}`
      ].join('\n');

      await interaction.reply({ content: serverInfo });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in server slash command: ${err.message}`);
    }
  }
};
