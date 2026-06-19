const db = require('../utils/db');

module.exports = {
  name: 'unprotectrole',
  description: 'Remove a role from the protected roles list',
  
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

    const idx = data.soc.protectedRoles.indexOf(role.id);
    if (idx === -1) {
      return message.reply({ content: `Role **@${role.name}** is not in the protected roles list.` });
    }

    data.soc.protectedRoles.splice(idx, 1);
    db.saveDb();
    message.reply({ content: `🔓 Removed **@${role.name}** from the protected roles list.` });
  },

  slashData: {
    name: 'unprotectrole',
    description: 'Remove a role from the protected roles list',
    options: [
      {
        name: 'role',
        description: 'Role to unprotect',
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

    const idx = data.soc.protectedRoles.indexOf(role.id);
    if (idx === -1) {
      return interaction.reply({ content: `Role **@${role.name}** is not in the protected roles list.`, ephemeral: true });
    }

    data.soc.protectedRoles.splice(idx, 1);
    db.saveDb();
    await interaction.reply({ content: `🔓 Removed **@${role.name}** from the protected roles list.` });
  }
};
