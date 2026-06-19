const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');

module.exports = {
  name: 'roleCreate',
  execute(role, client) {
    if (!role.guild) return;

    db.addLiveFeed('Role Created', `@${role.name}`);
    db.addSecurityEvent('ROLE_CREATE', `@${role.name}`, `Role was created.`);

    // Threat detection: 5 roles created in 10 seconds
    const triggered = securityEngine.trackRateLimit(role.guild.id, 'roleCreate', 5, 10000);
    if (triggered) {
      db.addThreat('Mass Role Creation', 'High', 'Spike in role creations detected.');
      db.addSecurityEvent('MASS_ROLE_CREATE_ALERT', 'Guild', 'Rate limit exceeded for role creation.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid role creations.');
    }
  },
};
