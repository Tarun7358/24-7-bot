const db = require('../utils/db');

module.exports = {
  name: 'watch',
  description: 'Add a user or bot to the security watchlist',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    if (!message.member.permissions.has('Administrator') && message.author.id !== message.guild.ownerId) {
      return message.reply({ content: '❌ You must be an Administrator to use this command.' });
    }

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply({ content: 'Please provide a valid user mention or ID.' });

    const data = db.getDb();
    if (!data.soc.watchlist) {
      data.soc.watchlist = { users: [], bots: [] };
    }

    const isBot = member.user.bot;
    if (isBot) {
      if (data.soc.watchlist.bots.includes(member.id)) {
        return message.reply({ content: `Bot **${member.user.tag}** is already watched.` });
      }
      data.soc.watchlist.bots.push(member.id);
    } else {
      if (data.soc.watchlist.users.includes(member.id)) {
        return message.reply({ content: `User **${member.user.tag}** is already watched.` });
      }
      data.soc.watchlist.users.push(member.id);
    }

    db.saveDb();
    message.reply({ content: `🟢 Added **${member.user.tag}** to the security watchlist.` });
  },

  slashData: {
    name: 'watch',
    description: 'Add a user or bot to the security watchlist',
    options: [
      {
        name: 'target',
        description: 'User or bot to watch',
        type: 6, // USER
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    if (!interaction.member.permissions.has('Administrator') && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '❌ You must be an Administrator to use this command.', ephemeral: true });
    }

    const member = interaction.options.getMember('target');
    if (!member) return interaction.reply({ content: 'Failed to find target member.', ephemeral: true });

    const data = db.getDb();
    if (!data.soc.watchlist) {
      data.soc.watchlist = { users: [], bots: [] };
    }

    const isBot = member.user.bot;
    if (isBot) {
      if (data.soc.watchlist.bots.includes(member.id)) {
        return interaction.reply({ content: `Bot **${member.user.tag}** is already watched.`, ephemeral: true });
      }
      data.soc.watchlist.bots.push(member.id);
    } else {
      if (data.soc.watchlist.users.includes(member.id)) {
        return interaction.reply({ content: `User **${member.user.tag}** is already watched.`, ephemeral: true });
      }
      data.soc.watchlist.users.push(member.id);
    }

    db.saveDb();
    await interaction.reply({ content: `🟢 Added **${member.user.tag}** to the security watchlist.` });
  }
};
