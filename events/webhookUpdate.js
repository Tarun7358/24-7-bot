const { AuditLogEvent, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const logger = require('../utils/logger');

module.exports = {
  name: 'webhookUpdate',
  async execute(channel) {
    const guild = channel.guild;
    if (!guild) return;

    try {
      const botMe = guild.members.me;
      if (!botMe || !botMe.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;

      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.WebhookCreate
      });
      
      const logEntry = fetchedLogs.entries.first();
      if (!logEntry) return;

      // Check if recent
      if (Date.now() - logEntry.createdAt.getTime() > 10000) return;

      const executor = logEntry.executor;
      if (!executor) return;

      const isBot = executor.bot;
      const dbData = db.getDb();
      const isWatched = dbData.soc?.watchlist?.users?.includes(executor.id) || dbData.soc?.watchlist?.bots?.includes(executor.id);

      await logger.log(
        guild,
        'WEBHOOK_CREATED',
        `Webhook \`${logEntry.target.name || 'Unnamed'}\` created in channel ${channel.toString()} by executor **${executor.tag}**.`,
        'security-logs'
      );

      if (isBot) {
        await logger.log(
          guild,
          'BOT_WEBHOOK_CREATION',
          `Bot **${executor.tag}** created a webhook in ${channel.toString()}.`,
          'bot-watchdog'
        );

        try {
          const webhooks = await channel.fetchWebhooks();
          const targetWebhook = webhooks.find(w => w.id === logEntry.target.id);
          if (targetWebhook) {
            await targetWebhook.delete('Automated Watchdog: Unauthorized bot webhook creation.');
            db.addThreat('Bot Webhook Abuse Blocked', 'HIGH', `Deleted webhook created by bot ${executor.tag} in ${channel.name}`);
            
            await logger.log(
              guild,
              'THREAT_BLOCKED',
              `⚠️ **AUTO-RECOVERY RESPONSE TRIGGERED**\nDeleted unauthorized webhook created by bot **${executor.tag}** in ${channel.toString()}.`,
              'threat-alerts'
            );
          }
        } catch (err) {
          console.error('[WATCHDOG] Failed to auto-recover webhook deletion:', err.message);
        }
      }

      if (isWatched) {
        await logger.log(
          guild,
          'WATCHED_WEBHOOK_CREATION',
          `Watched user/bot **${executor.tag}** created a webhook in ${channel.toString()}.`,
          'security-logs'
        );
      }

    } catch (err) {
      console.error('[WATCHDOG] Webhook update processing error:', err.message);
    }
  }
};
