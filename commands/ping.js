import { SlashCommandBuilder } from "@discordjs/builders";

/** @type {import("../types/command").default} */
const info = {
	data: new SlashCommandBuilder().setDescription("Replies with Pong!"),
	async interaction(interaction) {
		await interaction.reply("Pong!");
	},
};

export default info;