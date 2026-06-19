const leaveCommand = require('./leave');

module.exports = {
  name: 'disconnect',
  description: leaveCommand.description,
  execute: leaveCommand.execute,
  slashData: {
    name: 'disconnect',
    description: leaveCommand.description
  },
  executeSlash: leaveCommand.executeSlash
};
