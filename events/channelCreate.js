const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');

module.exports = {
  name: 'channelCreate',
  execute(channel, client) {
    if (!channel.guild) return;

    db.addLiveFeed('Channel Created', `#${channel.name}`);
    db.addSecurityEvent('CHANNEL_CREATE', `#${channel.name}`, `Channel was created.`);

    // Threat detection: 5 channels created in 10 seconds
    const triggered = securityEngine.trackRateLimit(channel.guild.id, 'channelCreate', 5, 10000);
    if (triggered) {
      db.addThreat('Mass Channel Creation', 'High', 'Spike in channel creations detected (possible channel raid).');
      db.addSecurityEvent('MASS_CHANNEL_CREATE_ALERT', 'Guild', 'Rate limit exceeded for channel creation.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid channel creations.');
    }
  },
};
