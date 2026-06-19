const config = require('../config');

module.exports = {
  name: 'help',
  description: 'List all available commands',
  
  execute(message, args, client) {
    try {
      const commandList = client.commands
        .map(cmd => `• \`${config.prefix}${cmd.name}\` or \`/${cmd.name}\` - ${cmd.description || 'No description provided.'}`)
        .join('\n');

      const helpInfo = [
        `🛠️ **Rage X Bot Command List**`,
        `All commands are available using prefix \`${config.prefix}\` or as Slash Commands:`,
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

  slashData: {
    name: 'help',
    description: 'List all available commands'
  },

  async executeSlash(interaction, client) {
    try {
      const commandList = client.commands
        .map(cmd => `• \`/${cmd.name}\` or \`${config.prefix}${cmd.name}\` - ${cmd.description || 'No description provided.'}`)
        .join('\n');

      const helpInfo = [
        `🛠️ **Rage X Bot Command List**`,
        `All commands are available as Slash Commands or using prefix \`${config.prefix}\`:`,
        ``,
        commandList,
        ``,
        `*Optimized for ultra-low memory hosting environments.*`
      ].join('\n');

      await interaction.reply({ content: helpInfo });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in help slash command: ${err.message}`);
    }
  }
};
