import { MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import log from "../../common/moderation/logging.js";
import { extractMessageExtremities, messageToText } from "../../lib/message.js";

/**
 * @file Enables Error reporting.
 *
 * @type {import("../../types/event").default<"messageDelete">}
 */
const event = {
	async event(message) {
		const guild = message.guild;
		if (!guild || guild.id !== process.env.GUILD_ID) return;
		const content = await messageToText(message);
		const { embeds, files } = await extractMessageExtremities(message);
		if (content)
			files.unshift(new MessageAttachment(Buffer.from(content, "utf-8"), "message.txt"));

		while (files.length > 10) files.pop();

		await log(
			guild,
			`${message.partial ? "Unknown message" : "Message"}${
				message.author ? " by " + message.author.toString() : ""
			} in ${message.channel.toString()} deleted!`,
			"messages",
			{
				embeds,
				files,
				components: [
					new MessageActionRow().addComponents(
						new MessageButton()
							.setEmoji("👀")
							.setLabel("View Context")
							.setStyle("LINK")
							.setURL(message.url),
					),
				],
			},
		);
	},
};

export default event;
