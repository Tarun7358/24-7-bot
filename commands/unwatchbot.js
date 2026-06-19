const unwatchCommand = require('./unwatch');

module.exports = {
  name: 'unwatchbot',
  description: 'Remove a bot from the security watchlist',
  execute: unwatchCommand.execute,
  slashData: {
    name: 'unwatchbot',
    description: 'Remove a bot from the security watchlist',
    options: unwatchCommand.slashData.options
  },
  executeSlash: unwatchCommand.executeSlash
};
