const config = require('../config');

module.exports = {
  name: 'messageCreate',
  execute(message, client) {
    // Ignore messages sent by bots or if they are system messages
    if (message.author.bot || message.system) return;

    // Check if the message starts with the prefix
    if (!message.content.startsWith(config.prefix)) return;

    // Parse the prefix, command name, and arguments
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Look up the command in the client.commands Collection
    const command = client.commands.get(commandName);

    if (!command) return;

    try {
      command.execute(message, args, client);
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error executing command "${commandName}": ${error.stack || error}`);
      
      message.reply({ 
        content: 'There was an error trying to execute that command!' 
      }).catch(err => {
        console.log(`[${timestamp}] [ERROR] Failed to send error reply: ${err.message}`);
      });
    }
  },
};
