const db = require('../utils/db');

module.exports = {
  name: 'protectrole',
  description: 'Add a role to the protected roles list',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    if (!message.member.permissions.has('Administrator') && message.author.id !== message.guild.ownerId) {
      return message.reply({ content: '❌ You must be an Administrator to use this command.' });
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
    if (!role) return message.reply({ content: 'Please provide a valid role mention, name, or ID.' });

    const data = db.getDb();
    if (!data.soc.protectedRoles) {
      data.soc.protectedRoles = [];
    }

    if (data.soc.protectedRoles.includes(role.id)) {
      return message.reply({ content: `Role **@${role.name}** is already protected.` });
    }

    data.soc.protectedRoles.push(role.id);
    db.saveDb();
    message.reply({ content: `🛡️ Added **@${role.name}** to the protected roles list. Any modifications or assignments will trigger immediate alerts.` });
  },

  slashData: {
    name: 'protectrole',
    description: 'Add a role to the protected roles list',
    options: [
      {
        name: 'role',
        description: 'Role to protect',
        type: 8, // ROLE
        required: true
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    if (!interaction.member.permissions.has('Administrator') && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '❌ You must be an Administrator to use this command.', ephemeral: true });
    }

    const role = interaction.options.getRole('role');
    if (!role) return interaction.reply({ content: 'Failed to find role.', ephemeral: true });

    const data = db.getDb();
    if (!data.soc.protectedRoles) {
      data.soc.protectedRoles = [];
    }

    if (data.soc.protectedRoles.includes(role.id)) {
      return interaction.reply({ content: `Role **@${role.name}** is already protected.`, ephemeral: true });
    }

    data.soc.protectedRoles.push(role.id);
    db.saveDb();
    await interaction.reply({ content: `🛡️ Added **@${role.name}** to the protected roles list. Any modifications or assignments will trigger immediate alerts.` });
  }
};
