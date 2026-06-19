const db = require('../utils/db');

module.exports = {
  name: 'protectchannel',
  description: 'Add a channel to the protected channels list',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    if (!message.member.permissions.has('Administrator') && message.author.id !== message.guild.ownerId) {
      return message.reply({ content: '❌ You must be an Administrator to use this command.' });
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.guild.channels.cache.find(c => c.name.toLowerCase() === args.join(' ').toLowerCase());
    if (!channel) return message.reply({ content: 'Please provide a valid channel mention, name, or ID.' });

    const data = db.getDb();
    if (!data.soc.protectedChannels) {
      data.soc.protectedChannels = [];
    }

    if (data.soc.protectedChannels.includes(channel.id)) {
      return message.reply({ content: `Channel **#${channel.name}** is already protected.` });
    }

    data.soc.protectedChannels.push(channel.id);
    db.saveDb();
    message.reply({ content: `🛡️ Added **#${channel.name}** to the protected channels list. Any updates or deletions will trigger immediate alerts.` });
  },

  slashData: {
    name: 'protectchannel',
    description: 'Add a channel to the protected channels list',
    options: [
      {
        name: 'channel',
        description: 'Channel to protect',
        type: 7, // CHANNEL
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    if (!interaction.member.permissions.has('Administrator') && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '❌ You must be an Administrator to use this command.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    if (!channel) return interaction.reply({ content: 'Failed to find channel.', ephemeral: true });

    const data = db.getDb();
    if (!data.soc.protectedChannels) {
      data.soc.protectedChannels = [];
    }

    if (data.soc.protectedChannels.includes(channel.id)) {
      return interaction.reply({ content: `Channel **#${channel.name}** is already protected.`, ephemeral: true });
    }

    data.soc.protectedChannels.push(channel.id);
    db.saveDb();
    await interaction.reply({ content: `🛡️ Added **#${channel.name}** to the protected channels list. Any updates or deletions will trigger immediate alerts.` });
  }
};
