const db = require('../utils/db');

module.exports = {
  name: 'unwatch',
  description: 'Remove a user or bot from the security watchlist',
  
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
      const idx = data.soc.watchlist.bots.indexOf(member.id);
      if (idx === -1) {
        return message.reply({ content: `Bot **${member.user.tag}** is not in the watchlist.` });
      }
      data.soc.watchlist.bots.splice(idx, 1);
    } else {
      const idx = data.soc.watchlist.users.indexOf(member.id);
      if (idx === -1) {
        return message.reply({ content: `User **${member.user.tag}** is not in the watchlist.` });
      }
      data.soc.watchlist.users.splice(idx, 1);
    }

    db.saveDb();
    message.reply({ content: `⚪ Removed **${member.user.tag}** from the security watchlist.` });
  },

  slashData: {
    name: 'unwatch',
    description: 'Remove a user or bot from the security watchlist',
    options: [
      {
        name: 'target',
        description: 'User or bot to unwatch',
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
      const idx = data.soc.watchlist.bots.indexOf(member.id);
      if (idx === -1) {
        return interaction.reply({ content: `Bot **${member.user.tag}** is not in the watchlist.`, ephemeral: true });
      }
      data.soc.watchlist.bots.splice(idx, 1);
    } else {
      const idx = data.soc.watchlist.users.indexOf(member.id);
      if (idx === -1) {
        return interaction.reply({ content: `User **${member.user.tag}** is not in the watchlist.`, ephemeral: true });
      }
      data.soc.watchlist.users.splice(idx, 1);
    }

    db.saveDb();
    await interaction.reply({ content: `⚪ Removed **${member.user.tag}** from the security watchlist.` });
  }
};
