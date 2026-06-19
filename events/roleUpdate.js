const { PermissionFlagsBits } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'roleUpdate',
  execute(oldRole, newRole, client) {
    if (!newRole.guild) return;

    // Track Name Changes
    if (oldRole.name !== newRole.name) {
      db.addLiveFeed('Role Updated', `@${oldRole.name} -> @${newRole.name}`);
      db.addSecurityEvent('ROLE_UPDATE', `@${newRole.name}`, `Role name changed from @${oldRole.name}`);
    }

    // Track Permission Alterations
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      db.addLiveFeed('Role Permissions Changed', `@${newRole.name}`);
      
      const newlyAdmin = newRole.permissions.has(PermissionFlagsBits.Administrator) && !oldRole.permissions.has(PermissionFlagsBits.Administrator);
      if (newlyAdmin) {
        db.addSecurityEvent('ROLE_ADMIN_GRANTED', `@${newRole.name}`, `Administrator permissions were granted to this role.`);
        db.addThreat('Dangerous Permission Grant', 'Medium', `Role @${newRole.name} was granted Administrator permissions.`);
      } else {
        db.addSecurityEvent('ROLE_PERM_CHANGE', `@${newRole.name}`, `Permissions modified.`);
      }
    }
  },
};
