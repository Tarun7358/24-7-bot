const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'security_db.json');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const defaultDb = {
  events: [],
  moderationLogs: [],
  liveFeed: [],
  threats: [],
  autoMod: [],
  stats: {
    messagesToday: 0,
    messagesThisWeek: 0,
    joinsToday: 0,
    joinsThisWeek: 0,
    leavesToday: 0,
    leavesThisWeek: 0,
    messageCounts: {},
    channelCounts: {},
    voiceSeconds: {},
    voiceStartTimes: {},
    dailyResetTimestamp: Date.now(),
    weeklyResetTimestamp: Date.now()
  },
  warnings: {},
  suggestions: [],
  polls: [],
  giveaways: [],
  verification: {
    roleId: '',
    channelId: '',
    requiredAgeDays: 0
  },
  soc: {
    liveStatsMessageId: '',
    securityDashboardMessageId: '',
    threadIds: {
      securityEvents: '',
      botActivity: '',
      adminActivity: '',
      threatAnalysis: '',
      auditReports: ''
    },
    protectedChannels: [],
    protectedRoles: [],
    watchlist: {
      users: [],
      bots: []
    },
    lastReportTimestamps: {
      hourly: 0,
      daily: 0,
      weekly: 0
    }
  }
};

let cache = defaultDb;

try {
  if (fs.existsSync(dbPath)) {
    cache = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    // Ensure all default properties exist
    cache.stats = { ...defaultDb.stats, ...cache.stats };
    cache.warnings = cache.warnings || {};
    cache.suggestions = cache.suggestions || [];
    cache.polls = cache.polls || [];
    cache.giveaways = cache.giveaways || [];
    cache.verification = { ...defaultDb.verification, ...cache.verification };
    cache.soc = { ...defaultDb.soc, ...cache.soc };
    cache.soc.threadIds = { ...defaultDb.soc.threadIds, ...cache.soc.threadIds };
    cache.soc.watchlist = { ...defaultDb.soc.watchlist, ...cache.soc.watchlist };
    cache.soc.lastReportTimestamps = { ...defaultDb.soc.lastReportTimestamps, ...cache.soc.lastReportTimestamps };
    cache.events = cache.events || [];
    cache.moderationLogs = cache.moderationLogs || [];
    cache.liveFeed = cache.liveFeed || [];
    cache.threats = cache.threats || [];
    cache.autoMod = cache.autoMod || [];
  } else {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), 'utf8');
  }
} catch (err) {
  console.error('[DB] Failed to initialize JSON database:', err);
}

function save() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Failed to save JSON database:', err);
  }
}

function checkResets() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  let changed = false;

  if (now - cache.stats.dailyResetTimestamp > oneDay) {
    cache.stats.messagesToday = 0;
    cache.stats.joinsToday = 0;
    cache.stats.leavesToday = 0;
    cache.stats.dailyResetTimestamp = now;
    changed = true;
  }

  if (now - cache.stats.weeklyResetTimestamp > oneWeek) {
    cache.stats.messagesThisWeek = 0;
    cache.stats.joinsThisWeek = 0;
    cache.stats.leavesThisWeek = 0;
    cache.stats.messageCounts = {}; // Reset activity leaderboard weekly to save memory
    cache.stats.channelCounts = {};
    cache.stats.weeklyResetTimestamp = now;
    changed = true;
  }

  if (changed) save();
}

module.exports = {
  getDb() {
    checkResets();
    return cache;
  },

  saveDb() {
    save();
  },

  // Security loggers
  addSecurityEvent(type, target, details) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.events.unshift({ timestamp, fullTimestamp, type, target, details });
    if (cache.events.length > 100) cache.events.pop(); // Upgraded to 100 per prompt
    save();
  },

  addModerationLog(action, user, moderator, reason) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.moderationLogs.unshift({ timestamp, fullTimestamp, action, user, moderator, reason });
    if (cache.moderationLogs.length > 100) cache.moderationLogs.pop(); // Upgraded to 100
    save();
  },

  addLiveFeed(action, details) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.liveFeed.unshift({ timestamp, fullTimestamp, action, details });
    if (cache.liveFeed.length > 100) cache.liveFeed.pop();
    save();
  },

  addThreat(type, rating, alertMessage) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.threats.unshift({ timestamp, fullTimestamp, type, rating, alertMessage });
    if (cache.threats.length > 50) cache.threats.pop();
    save();
  },

  addAutoMod(trigger, action, details) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.autoMod.unshift({ timestamp, fullTimestamp, trigger, action, details });
    if (cache.autoMod.length > 50) cache.autoMod.pop();
    save();
  },

  // Stats incremental functions
  incrementMessages(userId, channelId) {
    checkResets();
    cache.stats.messagesToday++;
    cache.stats.messagesThisWeek++;
    
    cache.stats.messageCounts[userId] = (cache.stats.messageCounts[userId] || 0) + 1;
    cache.stats.channelCounts[channelId] = (cache.stats.channelCounts[channelId] || 0) + 1;
    save();
  },

  incrementJoins() {
    checkResets();
    cache.stats.joinsToday++;
    cache.stats.joinsThisWeek++;
    save();
  },

  incrementLeaves() {
    checkResets();
    cache.stats.leavesToday++;
    cache.stats.leavesThisWeek++;
    save();
  },

  startVoiceSession(userId) {
    cache.stats.voiceStartTimes[userId] = Date.now();
    save();
  },

  endVoiceSession(userId) {
    const startTime = cache.stats.voiceStartTimes[userId];
    if (startTime) {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      cache.stats.voiceSeconds[userId] = (cache.stats.voiceSeconds[userId] || 0) + seconds;
      delete cache.stats.voiceStartTimes[userId];
      save();
    }
  },

  // Warnings
  warnUser(userId, moderator, reason) {
    if (!cache.warnings[userId]) cache.warnings[userId] = [];
    const timestamp = new Date().toISOString();
    cache.warnings[userId].push({ moderator, reason, timestamp });
    save();
    return cache.warnings[userId].length;
  },

  unwarnUser(userId, index) {
    if (cache.warnings[userId] && cache.warnings[userId][index]) {
      const removed = cache.warnings[userId].splice(index, 1);
      save();
      return removed[0];
    }
    return null;
  },

  getWarnings(userId) {
    return cache.warnings[userId] || [];
  },

  // Suggestions
  addSuggestion(id, authorTag, text, messageId, channelId) {
    cache.suggestions.push({ id, authorTag, text, status: 'PENDING', messageId, channelId, moderator: '', reason: '' });
    if (cache.suggestions.length > 100) cache.suggestions.shift();
    save();
  },

  updateSuggestion(id, status, moderator, reason) {
    const sug = cache.suggestions.find(s => s.id === id);
    if (sug) {
      sug.status = status;
      sug.moderator = moderator;
      sug.reason = reason;
      save();
      return sug;
    }
    return null;
  },

  // Giveaways
  addGiveaway(messageId, channelId, prize, winnersCount, endsAt) {
    cache.giveaways.push({ messageId, channelId, prize, winnersCount, endsAt, participants: [], ended: false });
    save();
  },

  participateInGiveaway(messageId, userId) {
    const gw = cache.giveaways.find(g => g.messageId === messageId);
    if (gw && !gw.ended && !gw.participants.includes(userId)) {
      gw.participants.push(userId);
      save();
      return true;
    }
    return false;
  },

  endGiveaway(messageId) {
    const gw = cache.giveaways.find(g => g.messageId === messageId);
    if (gw) {
      gw.ended = true;
      save();
      return gw;
    }
    return null;
  }
};
