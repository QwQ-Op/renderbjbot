import dotenv from "dotenv";
dotenv.config();

export default {
    name: "invite",
    description: "Get the bot's invite link",
    run: async (interaction) => {
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands&permissions=0`;
  
      return {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: `🔗 Add me to your server: ${inviteUrl}`
        }
      };
    }
  };
  