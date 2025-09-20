import dotenv from "dotenv";
dotenv.config();

export class InteractionContext {
    constructor(data) {
        this.data = data;
        this.type = data.type
        this.appId = process.env.CLIENT_ID;
        this.token = data.token;
        this.hasReplied = false; // track if we already replied
    }
    get member() {
        return this.data.member;
    }

    get user() {
        // console.log(this.data.member)
        return this.data.member?.user || this.data.user;
    }

    get msg() {
        return this.data.message
    }
    // Get option by name
    getOption(name) {
        return this.data.data?.options?.find(opt => opt.name === name);
    }

    // Directly get option value
    getOptionValue(name) {
        return this.getOption(name)?.value;
    }

    // Internal request
    async _api(method, endpoint, body) {
        const url = `https://discord.com/api/v10${endpoint}`;
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        return res.json().catch(() => ({}));
    }

    // One-time initial reply
    reply(payload) {
        if (this.hasReplied) throw new Error("Already replied");
        this.hasReplied = true;
        return {
            type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
            data: payload
        };
    }

    // Defer reply (useful if processing takes time)
    deferReply(ephemeral = false) {
        if (this.hasReplied) throw new Error("Already replied");
        this.hasReplied = true;
        return {
            type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
            data: ephemeral ? { flags: 64 } : {}
        };
    }

    // Edit the original response (works after reply/defer)
    async editReply(payload) {
        return this._api(
            "PATCH",
            `/webhooks/${this.appId}/${this.token}/messages/@original`,
            payload
        );
    }

    // Send extra messages (ephemeral or not)
    async followUp(payload) {
        return this._api(
            "POST",
            `/webhooks/${this.appId}/${this.token}`,
            payload
        );
    }

    update(payload) {
        if (this.type !== 3) {
            throw new Error("update() is only valid for component interactions");
        }
        return {
            type: 7, // MESSAGE_UPDATE
            data: payload
        };
    }
}
