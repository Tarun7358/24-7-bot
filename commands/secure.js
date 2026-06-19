const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const securityEngine = require('../utils/securityEngine');
const db = require('../utils/db');

// Function to generate the security center dashboard embed
async function generateDashboardEmbed(guild) {
  const audit = securityEngine.calculateHealthScore(guild);
  const data = db.getDb();

  // 1. Fetch Assets with permission error handling
  let webhookCount = 0;
  try {
    const webhooks = await guild.fetchWebhooks();
    webhookCount = webhooks.size;
  } catch (err) {
    webhookCount = 'N/A';
  }

  let integrationCount = 0;
  try {
    const integrations = await guild.fetchIntegrations();
    integrationCount = integrations.size;
  } catch (err) {
    integrationCount = 'N/A';
  }

  const botCount = guild.members.cache.filter(m => m.user.bot).size;
  const categoryCount = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

  // 2. Determine threat status and level
  let threatStatus = 'Clean';
  let threatLevel = 'Low';
  let threatIndicator = '🟢';
  if (data.threats.length > 0) {
    threatStatus = 'Threats Detected';
    // Get highest risk level
    const hasHigh = data.threats.some(t => t.rating.toLowerCase() === 'high');
    threatLevel = hasHigh ? 'High' : 'Medium';
    threatIndicator = hasHigh ? '🔴' : '🟡';
  }

  // 3. Format Lists
  const warningsList = audit.warnings.length > 0 
    ? audit.warnings.join('\n') 
    : '*No permission risks detected.*';

  const adminRolesList = audit.adminRoles.length > 0
    ? audit.adminRoles.map(r => `\`${r}\``).join(', ')
    : '*None*';

  const highRiskRolesList = audit.highRiskRoles.length > 0
    ? audit.highRiskRoles.map(r => `\`${r}\``).join(', ')
    : '*None*';

  const protectedRolesList = audit.protectedRoles.length > 0
    ? audit.protectedRoles.map(r => `\`${r}\``).join(', ')
    : '*None*';

  const recentEvents = data.events.slice(0, 10).map(e => {
    return `• \`[${e.timestamp}]\` **${e.type}** - ${e.target} (${e.details})`;
  }).join('\n') || '*No security events logged.*';

  const recentModLogs = data.moderationLogs.slice(0, 5).map(m => {
    return `\`[${m.timestamp}]\` **${m.action}**\n*Target:* \`${m.user}\` | *Mod:* \`${m.moderator}\`\n*Reason:* \`${m.reason}\``;
  }).join('\n\n') || '*No recent moderation logs.*';

  const activeThreatsList = data.threats.slice(0, 5).map(t => {
    return `• \`[${t.timestamp}]\` [${t.rating.toUpperCase()}] ${t.type} - ${t.alertMessage}`;
  }).join('\n') || '*No active threat alerts.*';

  const automodActionsCount = data.autoMod.length;
  const antispamActionsCount = data.autoMod.filter(a => a.trigger.includes('AntiSpam')).length;
  const joinProtectActionsCount = data.autoMod.filter(a => a.trigger.includes('Join')).length;

  // 4. Construct content block
  const dashboardText = [
    `╔════════════════════╗`,
    `║  XTREMEZ SECURITY  ║`,
    `╚════════════════════╝`,
    ``,
    `🛡️ **SECURITY OVERVIEW**`,
    `• Security Status: ${threatIndicator} **${audit.score >= 85 ? 'Protected' : audit.score >= 50 ? 'Caution' : 'Vulnerable'}**`,
    `• Security Score: **${audit.score}%** (Grade: **${audit.grade}**)`,
    `• Threat Level: **${threatLevel}**`,
    `• Monitoring: **Active**`,
    `• Last Scan: <t:${Math.floor(Date.now() / 1000)}:R>`,
    ``,
    `👥 **SERVER ASSET ANALYSIS**`,
    `• Members: \`${guild.memberCount}\` | Bots: \`${botCount}\``,
    `• Channels: \`${guild.channels.cache.size}\` (Categories: \`${categoryCount}\`)`,
    `• Roles: \`${guild.roles.cache.size}\``,
    `• Webhooks: \`${webhookCount}\` | Integrations: \`${integrationCount}\``,
    `• Boosts: \`${guild.premiumSubscriptionCount || 0}\``,
    ``,
    `📂 **PERMISSION ANALYSIS**`,
    `• Admin Roles: ${adminRolesList}`,
    `• High Risk: ${highRiskRolesList}`,
    `• Protected: ${protectedRolesList}`,
    `• Warnings:\n${warningsList}`,
    ``,
    `⚠️ **THREAT DETECTION & ALERTS**`,
    `• Threat Status: \`${threatStatus}\``,
    `• Risk Rating: \`${threatLevel}\``,
    `• Triggered Alerts:\n${activeThreatsList}`,
    ``,
    `🛡️ **AUTOMATED SECURITY ACTIONS**`,
    `• AutoMod Triggers: \`${automodActionsCount}\``,
    `• AntiSpam Actions: \`${antispamActionsCount}\``,
    `• Join Protection: \`${joinProtectActionsCount}\``,
    ``,
    `📝 **LATEST SECURITY EVENTS (10)**`,
    recentEvents,
    ``,
    `🔨 **RECENT MODERATION LOGS**`,
    recentModLogs
  ].join('\n');

  return new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription(dashboardText)
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Security Center v2 • 24/7 Server Protection' });
}

module.exports = {
  name: 'secure',
  description: 'Generates a premium security dashboard embed',
  
  // Traditional prefix command handler
  async execute(message, args, client) {
    if (!message.guild) return;

    try {
      const waitMsg = await message.reply({ content: '🔍 Scanning server security assets...' });
      const embed = await generateDashboardEmbed(message.guild);
      await waitMsg.edit({ content: null, embeds: [embed] });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in secure prefix command: ${err.message}`);
      message.reply({ content: 'Failed to run security scan.' }).catch(() => {});
    }
  },

  // Discord Slash command data
  slashData: {
    name: 'secure',
    description: 'Generates a premium security dashboard embed'
  },

  // Slash command handler
  async executeSlash(interaction, client) {
    if (!interaction.guild) return;

    try {
      await interaction.deferReply();
      const embed = await generateDashboardEmbed(interaction.guild);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error in secure slash command: ${err.message}`);
      await interaction.editReply({ content: 'Failed to generate security dashboard.' }).catch(() => {});
    }
  }
};
