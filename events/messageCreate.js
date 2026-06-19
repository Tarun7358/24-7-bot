const config = require('../config');
const db = require('../utils/db');
const securityEngine = require('../utils/securityEngine');

module.exports = {
  name: 'messageCreate',
  execute(message, client) {
    if (message.author.bot || message.system) return;
    if (!message.guild) return;

    // 1. Increment Activity Stats
    db.incrementMessages(message.author.id, message.channel.id);

    // 2. Run security scans
    securityEngine.detectMsgThreats(message);

    // 3. Command prefix check
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

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
