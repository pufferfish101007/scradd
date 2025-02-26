import type { ClientEvents, Client, Awaitable } from "discord.js";

type Event<K extends keyof ClientEvents> = {
	/** Pass `true` to make this callback only fire on the event’s first fire. */
	once?: boolean = false;
	/** Pass `false` to disable this callback. */
	enable?: boolean = true;
	/** A funcion to process events. */
	event(this: Client<true>, ...args: ClientEvents[K]): Awaitable<void>;
};
export default Event;
