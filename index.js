const { Client, GatewayIntentBits, Partials, Collection, Options } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Helper to log with ISO timestamps
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

log('Starting Rage X Bot...');

// Process-level error handling to prevent bot crashes
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.stack || error}`, 'CRITICAL');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'CRITICAL');
});

// Configure client with aggressive memory-saving options
// Disable caches for properties not needed by utility command set
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [
    Partials.Message,
    Partials.Channel
  ],
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    ReactionManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    StageInstanceManager: 0,
    GuildInviteManager: 0,
    GuildScheduledEventManager: 0,
    BaseGuildEmojiManager: 0,
    GuildBanManager: 0,
    GuildStickerManager: 0,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 300, // Run every 5 minutes
      lifetime: 60,  // Sweep messages older than 60 seconds
    }
  }
});

client.commands = new Collection();
client.musicPlayers = new Map();

// Error / stability event listeners
client.on('error', (error) => {
  log(`Discord Client Error: ${error.message || error}`, 'ERROR');
});

client.on('shardDisconnect', (event, id) => {
  log(`Shard ${id} disconnected from Discord gateway. Reconnecting...`, 'WARN');
});

client.on('shardReconnecting', (id) => {
  log(`Shard ${id} is attempting to reconnect...`, 'INFO');
});

client.on('shardReady', (id) => {
  log(`Shard ${id} is ready.`, 'INFO');
});

// Dynamically Load Commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath);
      if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
      } else {
        log(`The command at ${filePath} is missing a required "name" or "execute" property.`, 'WARN');
      }
    } catch (err) {
      log(`Failed to load command at ${filePath}: ${err.message}`, 'ERROR');
    }
  }
} else {
  log(`Commands directory not found at ${commandsPath}`, 'WARN');
}

// Dynamically Load Events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    } catch (err) {
      log(`Failed to load event at ${filePath}: ${err.message}`, 'ERROR');
    }
  }
} else {
  log(`Events directory not found at ${eventsPath}`, 'WARN');
}

// Dynamically Load Future Pluggable Modules
client.securityModules = new Collection();
const modulesPath = path.join(__dirname, 'modules');
if (!fs.existsSync(modulesPath)) {
  fs.mkdirSync(modulesPath, { recursive: true });
}

try {
  const moduleFiles = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));
  for (const file of moduleFiles) {
    const filePath = path.join(modulesPath, file);
    try {
      const mod = require(filePath);
      if ('name' in mod && typeof mod.init === 'function') {
        mod.init(client);
        client.securityModules.set(mod.name, mod);
        log(`Module "${mod.name}" plugged in successfully.`, 'INFO');
      } else {
        log(`The module at ${filePath} is missing required "name" or "init" method.`, 'WARN');
      }
    } catch (err) {
      log(`Failed to load module at ${filePath}: ${err.message}`, 'ERROR');
    }
  }
} catch (err) {
  log(`Failed to read modules directory: ${err.message}`, 'ERROR');
}

// Login
if (!config.token || config.token === 'YOUR_DISCORD_BOT_TOKEN') {
  log('Discord Bot Token is missing or placeholder value is used. Please configure .env file.', 'ERROR');
} else {
  client.login(config.token).catch(err => {
    log(`Failed to login to Discord: ${err.message}`, 'CRITICAL');
  });
}
