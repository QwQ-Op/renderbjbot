export default {
    name: "balance",
    description: "Check your balance",
    async run({ ctx, db, ui }) {
        const balance = await db.pocket.getBal(ctx.user.id);
        if (balance <= 0) {
            await db.pocket.addCoins(ctx.user.id, 1_000_000);
        }
        return ctx.reply({ content: `You have **${ui.amt.formatBal(balance)}**` });
    }
};
