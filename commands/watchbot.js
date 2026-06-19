const watchCommand = require('./watch');

module.exports = {
  name: 'watchbot',
  description: 'Add a bot to the security watchlist',
  execute: watchCommand.execute,
  slashData: {
    name: 'watchbot',
    description: 'Add a bot to the security watchlist',
    options: watchCommand.slashData.options
  },
  executeSlash: watchCommand.executeSlash
};
