const db = require('../utils/db');
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1. Process Button Click for Verification
    if (interaction.isButton()) {
      if (interaction.customId === 'xtremez_verify_btn') {
        try {
          await interaction.deferReply({ ephemeral: true });

          const data = db.getDb();
          const roleId = data.verification.roleId;
          const requiredAgeDays = data.verification.requiredAgeDays || 0;

          if (!roleId) {
            return interaction.editReply({ content: '❌ Verification system is not fully configured (missing role).' });
          }

          const role = interaction.guild.roles.cache.get(roleId);
          if (!role) {
            return interaction.editReply({ content: '❌ The verification role no longer exists in the server.' });
          }

          if (interaction.member.roles.cache.has(roleId)) {
            return interaction.editReply({ content: '✅ You are already verified!' });
          }

          // Age check
          const accountAgeDays = (Date.now() - interaction.user.createdTimestamp) / (1000 * 60 * 60 * 24);
          if (accountAgeDays < requiredAgeDays) {
            db.addSecurityEvent('VERIFY_FAILED', interaction.user.tag, `Failed age check. Age: ${accountAgeDays.toFixed(1)} days, Required: ${requiredAgeDays}`);
            db.addThreat('Suspicious Verification Attempt', 'Medium', `${interaction.user.tag} failed age check (Age: ${accountAgeDays.toFixed(1)} days).`);
            
            logger.log(interaction.guild, '⚠️ VERIFICATION BLOCKED', `• **User:** ${interaction.user.tag} (${interaction.toString()})\n• **Details:** Blocked due to account age (${accountAgeDays.toFixed(1)} days old, required: ${requiredAgeDays} days).`);
            return interaction.editReply({ content: `❌ Verification failed. Your account must be at least \`${requiredAgeDays} days\` old. (Your account: \`${accountAgeDays.toFixed(1)} days\` old).` });
          }

          // Suspicious flag checks (no avatar + very new account)
          if (!interaction.user.avatar && accountAgeDays < 7) {
            db.addThreat('Suspicious Account Verified', 'High', `${interaction.user.tag} verified with default avatar and new account (${accountAgeDays.toFixed(1)} days).`);
            logger.log(interaction.guild, '⚠️ SUSPICIOUS VERIFICATION', `• **User:** ${interaction.user.tag} (${interaction.toString()})\n• **Details:** User verified successfully but flagged as suspicious (no custom avatar & account age < 7 days).`);
          }

          // Grant verification role
          await interaction.member.roles.add(roleId);

          // Strip "Unverified" role if they have it
          const unverifiedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
          if (unverifiedRole && interaction.member.roles.cache.has(unverifiedRole.id)) {
            await interaction.member.roles.remove(unverifiedRole.id).catch(() => {});
          }

          db.addSecurityEvent('USER_VERIFIED', interaction.user.tag, 'Passed verification check.');
          logger.log(interaction.guild, '🛡️ USER VERIFIED', `• **User:** ${interaction.user.tag} (${interaction.toString()})\n• **Details:** Passed verification and assigned role ${role.toString()}.`);

          return interaction.editReply({ content: '✅ Verification successful! Welcome to the server.' });
        } catch (err) {
          console.error('[VERIFY ERROR]', err);
          return interaction.editReply({ content: `❌ Verification failed: ${err.message}` });
        }
      }
      return;
    }

    // 2. Process Slash Commands
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({ content: 'Command not found.', ephemeral: true }).catch(() => {});
    }

    try {
      if (typeof command.executeSlash === 'function') {
        await command.executeSlash(interaction, client);
      } else {
        await interaction.reply({ 
          content: 'This command does not support slash command execution.', 
          ephemeral: true 
        }).catch(() => {});
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ERROR] Error executing slash command /${interaction.commandName}: ${error.stack || error}`);
      
      const errorResponse = { 
        content: 'There was an error while executing this command!', 
        ephemeral: true 
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorResponse).catch(() => {});
      } else {
        await interaction.reply(errorResponse).catch(() => {});
      }
    }
  },
};
