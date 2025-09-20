export default {
  name: "ping",
  description: "Replies with pong!",
  async run({ ctx, ui }) {
    return ctx.reply({
      flags: 64,
      embeds: [
        {
          description: `🏓 Pong!`,
          color: ui.colors.green
        }
      ]
    });
  }
};
