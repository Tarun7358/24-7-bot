module.exports = {
  name: 'uptime',
  description: 'Show bot uptime in days, hours, minutes, and seconds',
  execute(message, args, client) {
    try {
      const totalSeconds = Math.floor(client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const uptimeString = [
        days > 0 ? `${days}d` : null,
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        `${seconds}s`
      ].filter(Boolean).join(' ');

      message.reply({
        content: `📈 **Uptime:** ${uptimeString}`
      }).catch(err => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ERROR] Failed to send reply in uptime command: ${err.message}`);
      });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in uptime command: ${err.message}`);
    }
  },
};
