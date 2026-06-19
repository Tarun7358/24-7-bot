const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'poll',
  description: 'Create a reaction poll (Yes/No or Multiple Choice)',
  
  async execute(message, args, client) {
    if (!message.guild) return;
    const content = args.join(' ');
    if (!content) return message.reply({ content: 'Please specify a question.' });

    // Check if there are options separated by pipe (|) or comma (,)
    let options = [];
    if (content.includes('|')) {
      options = content.split('|').map(o => o.trim());
    } else if (content.includes(',')) {
      options = content.split(',').map(o => o.trim());
    }

    let question = content;
    if (options.length > 1) {
      question = options.shift();
    }

    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

    let embedDesc = '';
    if (options.length > 0) {
      options = options.slice(0, 9); // Limit to 9
      embedDesc = options.map((opt, idx) => `${numberEmojis[idx]} ${opt}`).join('\n');
    } else {
      embedDesc = '👍 Yes\n👎 No';
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `📊 **POLL: ${question}**`,
        ``,
        embedDesc
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: `Created by ${message.author.tag}` });

    try {
      const msg = await message.channel.send({ embeds: [embed] });
      if (options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          await msg.react(numberEmojis[i]);
        }
      } else {
        await msg.react('👍');
        await msg.react('👎');
      }
      if (message.deletable) message.delete().catch(() => {});
    } catch (err) {
      message.reply({ content: `Failed to create poll: ${err.message}` });
    }
  },

  slashData: {
    name: 'poll',
    description: 'Create a reaction poll (Yes/No or Multiple Choice)',
    options: [
      {
        name: 'question',
        description: 'The question to ask',
        type: 3,
        required: true
      },
      {
        name: 'options',
        description: 'Comma separated list of options (e.g. Option A, Option B) - Max 9',
        type: 3,
        required: false
      }
    ]
  },

  async executeSlash(interaction, client) {
    if (!interaction.guild) return;
    const question = interaction.options.getString('question');
    const optionsStr = interaction.options.getString('options');

    let options = [];
    if (optionsStr) {
      options = optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);
    }

    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

    let embedDesc = '';
    if (options.length > 0) {
      options = options.slice(0, 9);
      embedDesc = options.map((opt, idx) => `${numberEmojis[idx]} ${opt}`).join('\n');
    } else {
      embedDesc = '👍 Yes\n👎 No';
    }

    const embed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setDescription([
        `📊 **POLL: ${question}**`,
        ``,
        embedDesc
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: `Created by ${interaction.user.tag}` });

    try {
      const msg = await interaction.channel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Poll created.', ephemeral: true });

      if (options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          await msg.react(numberEmojis[i]);
        }
      } else {
        await msg.react('👍');
        await msg.react('👎');
      }
    } catch (err) {
      await interaction.reply({ content: `Failed to create poll: ${err.message}`, ephemeral: true }).catch(() => {});
    }
  }
};
