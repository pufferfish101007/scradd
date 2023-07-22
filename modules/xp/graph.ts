import { type AnySelectMenuInteraction } from "discord.js";
import { recentXpDatabase } from "./misc.js";
import constants from "../../common/constants.js";

export default async function graph(interaction: AnySelectMenuInteraction) {
	if (!interaction.isUserSelectMenu())
		throw new TypeError("weeklyXpGraph SelectMenu not a UserSelectMenu!");

	if (interaction.user.id !== interaction.message.interaction?.user.id) return;

	if (constants.canvasEnabled) {
		const createCanvas = (await import("@napi-rs/canvas")).createCanvas;
		const Chart = (await import("chart.js/auto")).Chart;
		// @ts-ignore
		await import("chartjs-adapter-date-fns");

		const recentXp = [...recentXpDatabase.data].sort((one, two) => one.time - two.time);
		const maxDate = (recentXp[0]?.time ?? 0) + 604_800_000;

		const canvas = createCanvas(1000, 750);
		const context = canvas.getContext("2d");

		new Chart(context as unknown as CanvasRenderingContext2D, {
			options: {
				responsive: false,
				animation: false,
				parsing: false,
				plugins: { legend: { position: "top" } },
				scales: {
					x: {
						type: "time",
						grid: { display: false },
						time: { unit: "day", displayFormats: { day: "do (E)" } },
					},
					y: { min: 0 },
				},
				font: { family: "Sora", weight: "400", style: "normal" },
				elements: { point: { radius: 0 } },
			},
			plugins: [
				{
					id: "customCanvasBackgroundColor",
					beforeDraw(chart) {
						const { ctx } = chart;
						ctx.save();
						ctx.globalCompositeOperation = "destination-over";
						ctx.fillStyle = "white";
						ctx.fillRect(0, 0, chart.width, chart.height);
						ctx.restore();
					},
				},
			],
			type: "line",
			data: {
				datasets: interaction.users
					.map((user) => {
						const data = recentXp
							.filter((gain) => gain.time < maxDate && gain.user === user.id)
							.reduce<{ x: number; y: number }[]>((acc, xp) => {
								const previous = acc.at(-1) ?? { y: 0, x: recentXp[0]?.time ?? 0 };
								return [
									...acc,
									...Array.from(
										{ length: Math.floor((xp.time - previous.x) / 3_600_000) },
										(_, index) => ({
											y: previous.y,
											x: previous.x + 3_600_000 * index,
										}),
									),
									{ x: xp.time, y: xp.xp + previous?.y },
								];
							}, []);
						return {
							label: user.displayName,
							data: [
								...(data.length ? data : [{ y: 0, x: recentXp[0]?.time ?? 0 }]),
								{ x: maxDate, y: data.at(-1)?.y ?? 0 },
							],
						};
					})
					.sort((one, two) => (two.data.at(-1)?.y ?? 0) - (one.data.at(-1)?.y ?? 0)),
			},
		});

		await interaction.deferUpdate();

		await interaction.message.edit({
			files: [{ attachment: canvas.toBuffer("image/png"), name: "graph.png" }],
		});
	} else {
		interaction.ephemeral = true;
		await interaction.message.reply({ content: "XP graph has been disabled" });
	}
}
