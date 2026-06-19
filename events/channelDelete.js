const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');

module.exports = {
  name: 'channelDelete',
  execute(channel, client) {
    if (!channel.guild) return;

    db.addLiveFeed('Channel Deleted', `#${channel.name}`);
    db.addSecurityEvent('CHANNEL_DELETE', `#${channel.name}`, `Channel was deleted.`);

    // Threat detection: 3 channels deleted in 10 seconds (possible nuke)
    const triggered = securityEngine.trackRateLimit(channel.guild.id, 'channelDelete', 3, 10000);
    if (triggered) {
      db.addThreat('Mass Channel Deletion', 'High', 'Rapid channel deletions detected (possible server nuke).');
      db.addSecurityEvent('MASS_CHANNEL_DELETE_ALERT', 'Guild', 'Rate limit exceeded for channel deletion.');
      db.addAutoMod('AntiRaid Action', 'Alert Triggered', 'Flagged rapid channel deletions.');
    }
  },
};
