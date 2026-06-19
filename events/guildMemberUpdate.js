const { AuditLogEvent } = require('discord.js');
const db = require('../utils/db');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    if (!newMember.guild) return;

    // 1. Nickname Changes
    if (oldMember.nickname !== newMember.nickname) {
      const oldNick = oldMember.nickname || oldMember.user.username;
      const newNick = newMember.nickname || newMember.user.username;
      db.addLiveFeed('Nickname Changed', `${oldMember.user.tag}: ${oldNick} -> ${newNick}`);
    }

    // 2. Server Boost Events
    if (!oldMember.premiumSince && newMember.premiumSince) {
      db.addLiveFeed('Boost Event', `${newMember.user.tag} boosted the server! 🚀`);
      db.addSecurityEvent('SERVER_BOOST', newMember.user.tag, 'Started boosting the server.');
    }

    // 3. Timeout Detection
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (newTimeout && newTimeout !== oldTimeout && newTimeout > Date.now()) {
      db.addLiveFeed('Member Timed Out', newMember.user.tag);
      db.addSecurityEvent('MEMBER_TIMEOUT', newMember.user.tag, `Timed out until ${new Date(newTimeout).toLocaleTimeString()}`);
      
      let modTag = 'System';
      let timeoutReason = 'No reason provided';

      try {
        const botMe = newMember.guild.members.me;
        if (botMe && botMe.permissions.has('ViewAuditLog')) {
          const fetchedLogs = await newMember.guild.fetchAuditLogs({
            limit: 5,
            type: AuditLogEvent.MemberUpdate,
          });
          // Search for recent timeout update entry
          const timeoutLog = fetchedLogs.entries.find(
            entry => entry.target.id === newMember.id && Date.now() - entry.createdAt.getTime() < 5000
          );
          if (timeoutLog) {
            modTag = timeoutLog.executor ? timeoutLog.executor.tag : 'System';
            timeoutReason = timeoutLog.reason || 'No reason provided';
          }
        }
      } catch (err) {
        // Silent catch
      }

      db.addModerationLog('User Timeout', newMember.user.tag, modTag, timeoutReason);
    }
  },
};
