const db = require('../utils/db');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const { guild, user } = ban;
    if (!guild) return;

    db.addLiveFeed('User Banned', user.tag);
    db.addSecurityEvent('USER_BAN', user.tag, `Banned from the server.`);

    let modTag = 'System';
    let banReason = 'No reason provided';

    try {
      const botMe = guild.members.me;
      if (botMe && botMe.permissions.has('ViewAuditLog')) {
        const fetchedLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: 22, // MemberBanAdd (GuildAuditLogs.Actions.MEMBER_BAN_ADD is 22)
        });
        const banLog = fetchedLogs.entries.first();
        if (banLog && banLog.target.id === user.id) {
          modTag = banLog.executor ? banLog.executor.tag : 'System';
          banReason = banLog.reason || 'No reason provided';
        }
      }
    } catch (err) {
      // Silent catch
    }

    db.addModerationLog('Recent Ban', user.tag, modTag, banReason);
  },
};
