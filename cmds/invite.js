export default {
  name: "invite",
  description: "Get the bot's invite link",
  async run({ ctx, ui }) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${ctx.data.application_id}&scope=bot%20applications.commands&permissions=0`;
    return ctx.reply({
      flags: 64,
      content: `${ui.emojis.hit} Add me to your server: [Link](${inviteUrl})`
    })
    //console.log(JSON.stringify(ctx, null, 2))
  }
};