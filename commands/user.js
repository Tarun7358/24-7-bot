module.exports = {
  name: 'user',
  description: 'Display details about your account or a mentioned user',
  
  async execute(message, args, client) {
    try {
      const targetUser = message.mentions.users.first() || message.author;
      const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
      const creationDateString = `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`;

      const userInfo = [
        `👤 **User Details**`,
        `• **Username:** ${targetUser.tag}`,
        `• **User ID:** \`${targetUser.id}\``,
        `• **Account Created:** ${creationDateString}`
      ].join('\n');

      await message.reply({ content: userInfo });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in user command: ${err.message}`);
    }
  },

  slashData: {
    name: 'user',
    description: 'Display details about your account or a targeted user',
    options: [
      {
        name: 'target',
        description: 'The user to fetch details for',
        type: 6, // USER type
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    try {
      const targetUser = interaction.options.getUser('target') || interaction.user;
      const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
      const creationDateString = `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`;

      const userInfo = [
        `👤 **User Details**`,
        `• **Username:** ${targetUser.tag}`,
        `• **User ID:** \`${targetUser.id}\``,
        `• **Account Created:** ${creationDateString}`
      ].join('\n');

      await interaction.reply({ content: userInfo });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in user slash command: ${err.message}`);
    }
  }
};
