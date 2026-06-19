const db = require('../utils/db');

module.exports = {
  name: 'guildMemberAdd',
  execute(member, client) {
    if (!member.guild) return;

    db.addLiveFeed('Member Joined', member.user.tag);

    if (member.user.bot) {
      db.addSecurityEvent('BOT_ADDITION', member.user.tag, 'A new bot was added to the server.');
      db.addThreat('Suspicious Bot Addition', 'Medium', `Bot ${member.user.tag} (ID: ${member.id}) was invited.`);
      db.addAutoMod('Join Protection', 'Alert Triggered', `Flagged new bot invite: ${member.user.tag}`);
    }
  },
};
