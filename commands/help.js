const config = require('../config');

module.exports = {
  name: 'help',
  description: 'List all available commands',
  execute(message, args, client) {
    try {
      const commandList = client.commands
        .map(cmd => `• \`${config.prefix}${cmd.name}\` - ${cmd.description || 'No description provided.'}`)
        .join('\n');

      const helpInfo = [
        `🛠️ **Rage X Bot Command List**`,
        `All commands use the prefix: \`${config.prefix}\``,
        ``,
        commandList,
        ``,
        `*Optimized for ultra-low memory hosting environments.*`
      ].join('\n');

      message.reply({ content: helpInfo }).catch(err => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ERROR] Failed to send reply in help command: ${err.message}`);
      });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in help command: ${err.message}`);
    }
  },
};
