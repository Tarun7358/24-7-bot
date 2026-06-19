const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('./db');
const securityEngine = require('./securityEngine');

let isUpdating = false;

// Format duration utility
function getUptimeString(client) {
  const uptime = client.uptime;
  const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
  const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
  return `${days}d ${hours}h ${minutes}m`;
}

// Find or create thread helper
async function getOrCreateThread(channel, name) {
  try {
    let thread = channel.threads.cache.find(x => x.name === name);
    if (!thread) {
      const active = await channel.threads.fetchActive().catch(() => ({ threads: { find: () => null } }));
      thread = active.threads.find(x => x.name === name);
      if (!thread) {
        const archived = await channel.threads.fetchArchived().catch(() => ({ threads: { find: () => null } }));
        thread = archived.threads.find(x => x.name === name);
      }
    }
    if (!thread) {
      thread = await channel.threads.create({
        name: name,
        autoArchiveDuration: 10080, // 1 week
        reason: 'XTREMEZ SOC Thread Initialization'
      });
    }
    return thread;
  } catch (err) {
    console.error(`[SOC] Failed to get/create thread ${name}:`, err.message);
    return null;
  }
}

async function updateLiveStatsDashboard(guild, client) {
  const data = db.getDb();
  const liveStatsChannel = guild.channels.cache.find(c => c.name === 'xt-live-stats');
  if (!liveStatsChannel) return;

  const total = guild.memberCount;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const humans = total - bots;

  let online = 0;
  guild.members.cache.forEach(m => {
    if (m.presence && m.presence.status !== 'offline') online++;
  });

  const voiceCount = guild.voiceStates.cache.filter(vs => vs.channelId && !vs.member.user.bot).size;
  const health = securityEngine.calculateHealthScore(guild);

  // Most active channel
  let topChannel = 'None';
  let maxChanMsgs = 0;
  Object.entries(data.stats.channelCounts || {}).forEach(([cId, count]) => {
    if (count > maxChanMsgs) {
      maxChanMsgs = count;
      const chan = guild.channels.cache.get(cId);
      if (chan) topChannel = chan.toString();
    }
  });

  // Most active member
  let topMember = 'None';
  let maxUserMsgs = 0;
  Object.entries(data.stats.messageCounts || {}).forEach(([uId, count]) => {
    if (count > maxUserMsgs) {
      maxUserMsgs = count;
      const mem = guild.members.cache.get(uId);
      if (mem) topMember = mem.user.tag;
    }
  });

  const statsEmbed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription([
      `╔════════════════════╗`,
      `║ XTREMEZ LIVE STATS ║`,
      `╚════════════════════╝`,
      ``,
      `👥 **MEMBERSHIP**`,
      `• Total Members: \`${total}\``,
      `• Humans: \`${humans}\` | Bots: \`${bots}\``,
      `• Online: \`${online}\` | In Voice: \`${voiceCount}\``,
      ``,
      `💬 **ACTIVITY METRICS**`,
      `• Messages Today: \`${data.stats.messagesToday}\``,
      `• Joins Today: \`${data.stats.joinsToday}\` | Leaves Today: \`${data.stats.leavesToday}\``,
      `• Most Active Channel: ${topChannel}`,
      `• Most Active Member: \`${topMember}\``,
      ``,
      `🚀 **BOOST CONFIGURATION**`,
      `• Boosts: \`${guild.premiumSubscriptionCount || 0}\` (Tier \`${guild.premiumTier}\`)`,
      ``,
      `🛡️ **SYSTEM HEURISTICS**`,
      `• Server Health: \`${health.score}%\` (Grade: **${health.grade}**)`,
      `• Bot Uptime: \`${getUptimeString(client)}\``,
      ``,
      `*Updated: <t:${Math.floor(Date.now() / 1000)}:R>*`
    ].join('\n'))
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Public Experience Operations' });

  try {
    let msg = null;
    if (data.soc.liveStatsMessageId) {
      msg = await liveStatsChannel.messages.fetch(data.soc.liveStatsMessageId).catch(() => null);
    }

    if (msg) {
      await msg.edit({ embeds: [statsEmbed] });
    } else {
      const newMsg = await liveStatsChannel.send({ embeds: [statsEmbed] });
      data.soc.liveStatsMessageId = newMsg.id;
      db.saveDb();
    }
  } catch (err) {
    console.error('[SOC] Live stats dashboard update error:', err.message);
  }
}

async function updateSecurityDashboard(guild, client) {
  const data = db.getDb();
  const securityCenterChannel = guild.channels.cache.find(c => c.name === 'xt-security-center');
  if (!securityCenterChannel) return;

  const audit = securityEngine.calculateHealthScore(guild);

  // Webhooks
  let webhooksCount = 0;
  try {
    const webhooks = await guild.fetchWebhooks();
    webhooksCount = webhooks.size;
  } catch (e) {
    webhooksCount = 'N/A';
  }

  // Admin users count
  const adminUsersCount = guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot).size;
  const adminBotsCount = guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && m.user.bot).size;

  let threatLevel = 'LOW';
  let threatIndicator = '🟢';
  if (data.threats.length > 0) {
    const hasHigh = data.threats.some(t => t.rating.toLowerCase() === 'high');
    threatLevel = hasHigh ? 'HIGH' : 'MEDIUM';
    threatIndicator = hasHigh ? '🔴' : '🟡';
  }

  const lastIncident = data.threats[0] ? `\`[${data.threats[0].timestamp}]\` ${data.threats[0].type}` : '*None Recorded*';

  const secEmbed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setDescription([
      `╔════════════════════╗`,
      `║   SECURITY OPS     ║`,
      `╚════════════════════╝`,
      ``,
      `🛡️ **TELEMETRY REPORT**`,
      `• Security Status: ${threatIndicator} **${audit.score >= 85 ? 'SECURE' : audit.score >= 50 ? 'CAUTION' : 'VULNERABLE'}**`,
      `• Security Score: **${audit.score}%** (Grade: **${audit.grade}**)`,
      `• Threat Level: **${threatLevel}**`,
      `• Monitoring: **Active**`,
      ``,
      `🔒 **PRIVILEGED ACCESS ENTITIES**`,
      `• Protected Roles: \`${data.soc.protectedRoles?.length || 0}\` | Admin Roles: \`${audit.adminRoles?.length || 0}\``,
      `• Administrator Users: \`${adminUsersCount}\` | Admin Bots: \`${adminBotsCount}\``,
      `• Watched Users: \`${data.soc.watchlist?.users?.length || 0}\` | Watched Bots: \`${data.soc.watchlist?.bots?.length || 0}\``,
      `• Webhooks Active: \`${webhooksCount}\` | Protected Channels: \`${data.soc.protectedChannels?.length || 0}\``,
      ``,
      `🔍 **VERIFICATION & SYSTEM**`,
      `• Verification Status: \`${guild.verificationLevel}\``,
      `• Bot Uptime: \`${getUptimeString(client)}\``,
      `• Last Scan Time: <t:${Math.floor(Date.now() / 1000)}:R>`,
      `• Last Incident: ${lastIncident}`
    ].join('\n'))
    .setTimestamp()
    .setFooter({ text: 'XTREMEZ Security Operations Center' });

  try {
    let msg = null;
    if (data.soc.securityDashboardMessageId) {
      msg = await securityCenterChannel.messages.fetch(data.soc.securityDashboardMessageId).catch(() => null);
    }

    if (msg) {
      await msg.edit({ embeds: [secEmbed] });
    } else {
      const newMsg = await securityCenterChannel.send({ embeds: [secEmbed] });
      data.soc.securityDashboardMessageId = newMsg.id;
      db.saveDb();
    }
  } catch (err) {
    console.error('[SOC] Security dashboard update error:', err.message);
  }
}

async function runScheduledReports(guild, client) {
  const data = db.getDb();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * ONE_DAY;

  const securityCenter = guild.channels.cache.find(c => c.name === 'xt-security-center');
  if (!securityCenter) return;

  const threadIds = data.soc.threadIds || {};
  let reportsThread = null;
  let eventsThread = null;

  if (threadIds.auditReports) {
    reportsThread = await guild.channels.fetch(threadIds.auditReports).catch(() => null);
  }
  if (threadIds.securityEvents) {
    eventsThread = await guild.channels.fetch(threadIds.securityEvents).catch(() => null);
  }

  // 1. Hourly Report: Security Summary (in Security Events thread)
  if (now - (data.soc.lastReportTimestamps?.hourly || 0) >= ONE_HOUR) {
    if (eventsThread) {
      const health = securityEngine.calculateHealthScore(guild);
      const recentSpamTriggers = data.autoMod.filter(a => Date.now() - new Date(a.fullTimestamp).getTime() < ONE_HOUR).length;
      
      const hourlyEmbed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `📊 **HOURLY SECURITY SUMMARY**`,
          `• **Score:** \`${health.score}%\` (Grade: \`${health.grade}\`)`,
          `• **AutoMod Actions (Hour):** \`${recentSpamTriggers}\``,
          `• **Active Threats:** \`${data.threats.length}\``,
          `• **Uptime:** \`${getUptimeString(client)}\``
        ].join('\n'))
        .setTimestamp();
      
      eventsThread.send({ embeds: [hourlyEmbed] }).catch(() => {});
    }
    data.soc.lastReportTimestamps.hourly = now;
    db.saveDb();
  }

  // 2. Daily Report: Server Report (in Audit Reports thread)
  if (now - (data.soc.lastReportTimestamps?.daily || 0) >= ONE_DAY) {
    if (reportsThread) {
      const health = securityEngine.calculateHealthScore(guild);
      const dailyEmbed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `📊 **DAILY SERVER REPORT**`,
          `• **Growth (Joins Today):** \`${data.stats.joinsToday}\` | Leaves: \`${data.stats.leavesToday}\``,
          `• **Total Messages:** \`${data.stats.messagesToday}\``,
          `• **Incidents Flagged:** \`${data.threats.length}\``,
          `• **AutoMod Triggers:** \`${data.autoMod.length}\``,
          `• **Health score:** \`${health.score}%\``
        ].join('\n'))
        .setTimestamp();

      reportsThread.send({ embeds: [dailyEmbed] }).catch(() => {});
    }
    data.soc.lastReportTimestamps.daily = now;
    db.saveDb();
  }

  // 3. Weekly Report: Community & Growth (in Audit Reports thread)
  if (now - (data.soc.lastReportTimestamps?.weekly || 0) >= ONE_WEEK) {
    if (reportsThread) {
      const health = securityEngine.calculateHealthScore(guild);
      const weeklyEmbed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription([
          `📊 **WEEKLY PERFORMANCE REPORT**`,
          `• **Growth (Joins This Week):** \`${data.stats.joinsThisWeek}\` | Leaves: \`${data.stats.leavesThisWeek}\``,
          `• **Total Messages:** \`${data.stats.messagesThisWeek}\``,
          `• **Final Security score:** \`${health.score}%\``,
          `• **Security status:** \`ACTIVE / SECURE\``
        ].join('\n'))
        .setTimestamp();

      reportsThread.send({ embeds: [weeklyEmbed] }).catch(() => {});
    }
    data.soc.lastReportTimestamps.weekly = now;
    db.saveDb();
  }
}

module.exports = {
  async initSoc(guild, client) {
    try {
      const data = db.getDb();

      // 1. PUBLIC EXPERIENCE CATEGORY & CHANNELS
      let publicCategory = guild.channels.cache.find(c => c.name === '📊 XTREMEZ STATS' && c.type === ChannelType.GuildCategory);
      if (!publicCategory) {
        publicCategory = await guild.channels.create({
          name: '📊 XTREMEZ STATS',
          type: ChannelType.GuildCategory
        });
      }

      // Live Stats Text Channel
      let liveStatsChannel = guild.channels.cache.find(c => c.name === 'xt-live-stats' && c.type === ChannelType.GuildText);
      if (!liveStatsChannel) {
        liveStatsChannel = await guild.channels.create({
          name: 'xt-live-stats',
          type: ChannelType.GuildText,
          topic: 'XTREMEZ Live Server statistics dashboard'
        });
      }

      // 2. SECURITY OPERATIONS CENTER (SOC)
      let socCategory = guild.channels.cache.find(c => c.name === '🛡️ SECURITY OPS' && c.type === ChannelType.GuildCategory);
      if (!socCategory) {
        socCategory = await guild.channels.create({
          name: '🛡️ SECURITY OPS',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            }
          ]
        });
      }

      const socChannels = [
        'xt-security-center',
        'security-logs',
        'admin-logs',
        'bot-watchdog',
        'threat-alerts',
        'audit-monitor'
      ];

      for (const name of socChannels) {
        let chan = guild.channels.cache.find(c => c.name === name && c.parentId === socCategory.id);
        if (!chan) {
          await guild.channels.create({
            name: name,
            type: ChannelType.GuildText,
            parent: socCategory.id
          });
        }
      }

      // 3. THREAD INITIALIZATION under #xt-security-center
      const securityCenterChannel = guild.channels.cache.find(c => c.name === 'xt-security-center' && c.parentId === socCategory.id);
      if (securityCenterChannel) {
        const threadsList = [
          { key: 'securityEvents', name: '🧵 Security Events' },
          { key: 'botActivity', name: '🧵 Bot Activity' },
          { key: 'adminActivity', name: '🧵 Admin Activity' },
          { key: 'threatAnalysis', name: '🧵 Threat Analysis' },
          { key: 'auditReports', name: '🧵 Audit Reports' }
        ];

        for (const t of threadsList) {
          const threadObj = await getOrCreateThread(securityCenterChannel, t.name);
          if (threadObj) {
            data.soc.threadIds[t.key] = threadObj.id;
          }
        }
        db.saveDb();
      }

      // Trigger updates immediately
      await updateLiveStatsDashboard(guild, client);
      await updateSecurityDashboard(guild, client);
      await runScheduledReports(guild, client);

    } catch (err) {
      console.error('[SOC] Initialization failed:', err.message);
    }
  },

  async runTick(client) {
    if (isUpdating) return;
    isUpdating = true;
    for (const guild of client.guilds.cache.values()) {
      try {
        await updateLiveStatsDashboard(guild, client);
        await updateSecurityDashboard(guild, client);
        await runScheduledReports(guild, client);
      } catch (err) {
        console.error(`[SOC] Tick update failed for guild ${guild.name}:`, err.message);
      }
    }
    isUpdating = false;
  },

  async sendToThread(guild, threadKey, content) {
    const data = db.getDb();
    const threadId = data.soc.threadIds?.[threadKey];
    if (threadId) {
      try {
        const thread = guild.channels.cache.get(threadId) || await guild.channels.fetch(threadId);
        if (thread) {
          if (typeof content === 'string') {
            await thread.send({ content });
          } else {
            await thread.send(content);
          }
        }
      } catch (err) {
        // Silent catch
      }
    }
  }
};
