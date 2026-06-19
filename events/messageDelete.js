const logger = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  execute(message, client) {
    if (!message.guild || (message.author && message.author.bot)) return;

    const authorTag = message.author ? `${message.author.tag} (${message.author.toString()})` : 'Unknown';
    const content = message.content ? `\`${message.content}\`` : '*No text content (possibly attachment or embed)*';

    logger.log(
      message.guild,
      '🗑️ MESSAGE DELETED',
      `• **Author:** ${authorTag}\n• **Channel:** ${message.channel.toString()}\n• **Content:** ${content}`
    );
  }
};
