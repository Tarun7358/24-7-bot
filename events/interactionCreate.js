module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Only process slash commands
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
