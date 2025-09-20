import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

export class DB {
    constructor(ui) {
        this.client = null;
        this.db = null;
        this.ui = ui;
    }

    async connect() {
        if (this.db) return this.db;

        if (!process.env.MONGO_URI) {
            throw new Error("❌ Missing MONGO_URI in .env");
        }

        this.client = new MongoClient(process.env.MONGO_URI);

        await this.client.connect();
        this.db = this.client.db("CasinoDicordBot");
        console.log("✅ Connected to MongoDB");
        return this.db;
    }

    // --------------------------
    // User collection
    // --------------------------
    async getUser(userId) {
        const database = await this.connect();
        const users = database.collection("users");

        let user = await users.findOne({ userId });
        if (!user) {
            user = {
                userId,
                coins: 100,
                activeGames: {},
                level: 1,
                exp: 0
            };
            await users.insertOne(user);
        }
        return user;
    }

    async updateUser(userId, updates) {
        const database = await this.connect();
        const users = database.collection("users");

        await users.updateOne({ userId }, { $set: updates }, { upsert: true });
        return this.getUser(userId);
    }

    async incrementUser(userId, increments) {
        const database = await this.connect();
        const users = database.collection("users");

        await users.updateOne({ userId }, { $inc: increments }, { upsert: true });
        return this.getUser(userId);
    }

    pocket = {
        addCoins: async (userId, amount) => this.incrementUser(userId, { coins: amount }),
        subCoins: async (userId, amount) => this.incrementUser(userId, { coins: -amount }),
        setCoins: async (userId, amount) => this.setUserField(userId, { coins: amount }),
        getBal: async (userId) => {
            const user = await this.getUser(userId);
            return `${user.coins || 0}`;
        }
    };

}
