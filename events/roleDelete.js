const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');

module.exports = {
  name: 'roleDelete',
  execute(role, client) {
    if (!role.guild) return;

    db.addLiveFeed('Role Deleted', `@${role.name}`);
    db.addSecurityEvent('ROLE_DELETE', `@${role.name}`, `Role was deleted.`);

    // Threat detection: 3 roles deleted in 10 seconds (possible nuke)
    const triggered = securityEngine.trackRateLimit(role.guild.id, 'roleDelete', 3, 10000);
    if (triggered) {
      db.addThreat('Mass Role Deletion', 'High', 'Rapid role deletions detected (possible server nuke).');
      db.addSecurityEvent('MASS_ROLE_DELETE_ALERT', 'Guild', 'Rate limit exceeded for role deletion.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid role deletions.');
    }
  },
};
