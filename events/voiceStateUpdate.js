import { ChannelType } from "discord.js";
import CONSTANTS from "../common/CONSTANTS.js";
import log from "../common/moderation/logging.js";
import breakRecord from "../common/records.js";

/** @type {import("../common/types/event").default<"voiceStateUpdate">} */
export default async function event(oldState, newState) {
	if (!newState.member || newState.guild.id !== process.env.GUILD_ID) return;

	const logs = [];
	if (oldState.channel !== newState.channel || !newState.channel) {
		if (newState.channel) {
			logs.push(`joined voice channel ${newState.channel.toString()}`);

			await breakRecord(
				1,
				newState.channel.members.toJSON(),
				newState.channel.members.size,
				newState.channel.type === ChannelType.GuildVoice
					? newState.channel
					: CONSTANTS.channels.general,
			);
		} else if (oldState.channel) logs.push(`left voice channel ${oldState.channel.toString()}`);
	} else {
		if (oldState.serverMute !== newState.serverMute) {
			logs.push(`was${newState.serverMute ? "" : " un"} server muted`);
		} else if (oldState.mute !== newState.mute) {
			logs.push(`${newState.mute ? "" : " un"}muted in ${newState.channel.toString()}`);
		}
		if (oldState.serverDeaf !== newState.serverDeaf) {
			logs.push(`was${newState.serverDeaf ? "" : " un"} server deafened`);
		} else if (oldState.deaf !== newState.deaf) {
			logs.push(`${newState.deaf ? "" : " un"}deafened in ${newState.channel.toString()}`);
		}
		if (oldState.suppress !== newState.suppress) {
			logs.push(
				`${
					newState.suppress ? "moved to the audience" : "became a speaker"
				} in ${newState.channel.toString()}`,
			);
		}
		if (oldState.streaming !== newState.streaming) {
			logs.push(
				`${
					newState.streaming ? "started" : "stopped"
				} streaming in ${newState.channel.toString()}`,
			);
		}
	}

	await Promise.all(
		logs.map(
			(edit) =>
				newState.member &&
				log(`🔊 Member ${newState.member.toString()} ` + edit + `!`, "voice"),
		),
	);
}
