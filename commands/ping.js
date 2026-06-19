module.exports = {
  name: 'ping',
  description: 'Display bot latency and API latency',
  async execute(message, args, client) {
    try {
      const sent = await message.reply({ content: 'Pinging...' });
      const latency = sent.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);
      
      await sent.edit({
        content: `🏓 **Pong!**\n• **Bot Latency:** ${latency}ms\n• **API Latency:** ${apiLatency}ms`
      });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in ping command: ${err.message}`);
    }
  },
};
