const { AuditLogEvent } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    if (!member.guild) return;

    db.addLiveFeed('Member Left', member.user.tag);

    // Detect if this departure was a moderator kick
    try {
      // Requires View Audit Log permission
      const botMe = member.guild.members.me;
      if (botMe && botMe.permissions.has('ViewAuditLog')) {
        const fetchedLogs = await member.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberKick,
        });
        const kickLog = fetchedLogs.entries.first();
        if (kickLog) {
          const { target, executor, reason, createdAt } = kickLog;
          // Verify it matches our member and happened within 5 seconds
          if (target.id === member.id && Date.now() - createdAt.getTime() < 5000) {
            const modTag = executor ? executor.tag : 'System';
            const kickReason = reason || 'No reason provided';
            db.addModerationLog('Recent Kick', member.user.tag, modTag, kickReason);
            db.addSecurityEvent('MEMBER_KICK', member.user.tag, `Kicked by ${modTag}.`);
          }
        }
      }
    } catch (err) {
      // Fail silently (e.g. permission error or API rate limit)
    }
  },
};
