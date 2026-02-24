require("dotenv").config();
const cron = require("node-cron");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const activeGames = new Map();

client.once("ready", () => {
  console.log("MosqueperroBot online 🐶");

  // 🌅 MENSAJE DIARIO 7:00
  cron.schedule("0 7 * * *", async () => {
    const channelId = "⏰│𝓑𝓾𝓮𝓷𝓸𝓼-𝓭𝓲𝓪𝓼";
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("amanecer_bien")
        .setLabel("😇 Bien")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("amanecer_mal")
        .setLabel("😢 Mal")
        .setStyle(ButtonStyle.Danger)
    );

    channel.send({
      content: "🌅 Buenos días Mosqueperros.\n¿Cómo has amanecido?",
      components: [row]
    });
  });
});

// =========================
// MENSAJES
// =========================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  // 🪨 PIEDRA PAPEL TIJERA
  if (args[0] === "!rps") {
    const opponent = message.mentions.users.first();
    if (!opponent)
      return message.reply("Menciona a alguien para jugar.");

    if (opponent.bot)
      return message.reply("No puedes jugar contra un bot.");

    const acceptButton = new ButtonBuilder()
      .setCustomId("accept_rps")
      .setLabel("Aceptar duelo")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(acceptButton);

    const gameMessage = await message.channel.send({
      content: `${opponent}, ${message.author.username} te reta a Piedra Papel Tijera.`,
      components: [row]
    });

    activeGames.set(gameMessage.id, {
      player1: message.author,
      player2: opponent,
      choices: {}
    });
  }

  // 🪙 COINFLIP
  if (args[0] === "!coinflip") {

    // 0.1% probabilidad especial
    if (Math.random() < 0.001) {
      return message.reply("💎 BORDE LEGENDARIO 0.1% WTF");
    }

    const result = Math.random() < 0.5
      ? "<:mpcoin:1472735253574717673> Cara"
      : "<:mpcoin:1472735253574717673> Cruz";

    message.reply(result);
  }
});

// =========================
// BOTONES
// =========================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // 🌅 AMANECER
  if (interaction.customId === "amanecer_bien") {
    return interaction.reply({
      content: `${interaction.user} ha amanecido bien 😇`
    });
  }

  if (interaction.customId === "amanecer_mal") {
    return interaction.reply({
      content: `${interaction.user} ha amanecido mal 😈`
    });
  }

  const game = activeGames.get(interaction.message.id);
  if (!game) return;

  // Aceptar partida
  if (interaction.customId === "accept_rps") {
    if (interaction.user.id !== game.player2.id)
      return interaction.reply({
        content: "No es tu partida.",
        ephemeral: true
      });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("piedra").setEmoji("🪨").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("papel").setEmoji("📄").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("tijera").setEmoji("✂️").setStyle(ButtonStyle.Primary)
    );

    await interaction.update({
      content: "Elegid vuestra jugada:",
      components: [buttons]
    });
  }

  // Elegir jugada
  if (["piedra", "papel", "tijera"].includes(interaction.customId)) {

    if (![game.player1.id, game.player2.id].includes(interaction.user.id))
      return interaction.reply({
        content: "No estás en esta partida.",
        ephemeral: true
      });

    game.choices[interaction.user.id] = interaction.customId;

    await interaction.reply({
      content: "Elección guardada ✅",
      ephemeral: true
    });

    if (Object.keys(game.choices).length === 2) {

      const p1 = game.choices[game.player1.id];
      const p2 = game.choices[game.player2.id];

      let winner;

      if (p1 === p2) {
        winner = "Empate 🤝";
      } else if (
        (p1 === "piedra" && p2 === "tijera") ||
        (p1 === "papel" && p2 === "piedra") ||
        (p1 === "tijera" && p2 === "papel")
      ) {
        winner = `${game.player1.username} gana 🎉`;
      } else {
        winner = `${game.player2.username} gana 🎉`;
      }

      await interaction.message.edit({
        content:
          `🪨 Piedra Papel Tijera\n\n` +
          `${game.player1.username}: ${p1}\n` +
          `${game.player2.username}: ${p2}\n\n` +
          winner,
        components: []
      });

      activeGames.delete(interaction.message.id);
    }
  }
});

client.login(process.env.TOKEN);