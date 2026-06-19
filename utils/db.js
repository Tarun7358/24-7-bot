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
  autoMod: []
};

let cache = defaultDb;

try {
  if (fs.existsSync(dbPath)) {
    cache = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
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

module.exports = {
  getDb() {
    return cache;
  },

  addSecurityEvent(type, target, details) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.events.unshift({ timestamp, fullTimestamp, type, target, details });
    if (cache.events.length > 10) cache.events.pop();
    save();
  },

  addModerationLog(action, user, moderator, reason) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.moderationLogs.unshift({ timestamp, fullTimestamp, action, user, moderator, reason });
    if (cache.moderationLogs.length > 10) cache.moderationLogs.pop();
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
    if (cache.threats.length > 20) cache.threats.pop();
    save();
  },

  addAutoMod(trigger, action, details) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = new Date().toISOString();
    cache.autoMod.unshift({ timestamp, fullTimestamp, trigger, action, details });
    if (cache.autoMod.length > 10) cache.autoMod.pop();
    save();
  }
};
