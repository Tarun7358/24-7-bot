const db = require('../utils/db');

module.exports = {
  name: 'guildUpdate',
  execute(oldGuild, newGuild, client) {
    db.addLiveFeed('Server Settings Change', newGuild.name);
    db.addSecurityEvent('SERVER_UPDATE', newGuild.name, `Server configurations updated.`);
  },
};
