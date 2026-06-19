const logger = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || (newMessage.author && newMessage.author.bot)) return;
    if (oldMessage.content === newMessage.content) return;

    const authorTag = newMessage.author ? `${newMessage.author.tag} (${newMessage.author.toString()})` : 'Unknown';
    const oldContent = oldMessage.content ? `\`${oldMessage.content}\`` : '*No content*';
    const newContent = newMessage.content ? `\`${newMessage.content}\`` : '*No content*';

    logger.log(
      newMessage.guild,
      '📝 MESSAGE EDITED',
      `• **Author:** ${authorTag}\n• **Channel:** ${newMessage.channel.toString()}\n• **Before:** ${oldContent}\n• **After:** ${newContent}`
    );
  }
};
