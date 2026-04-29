import { gameClient } from "@/lib/network/client";
import type { ClientMessage } from "@/lib/protocol";

/**
 * Send a client message after a visible progress overlay. Mirrors the time
 * cost of real-lab passive transformations (drying, calcining, boiling,
 * cooling) so students feel the step is non-instant.
 *
 * Dispatches a `process-start` CustomEvent that <ProcessProgress /> renders.
 * The message is sent only after the delay so server state and UI stay in sync
 * with the visual finish.
 */
export function slowSend(message: ClientMessage, label: string, durationMs: number): void {
	window.dispatchEvent(
		new CustomEvent("process-start", {
			detail: { label, durationMs },
		}),
	);
	setTimeout(() => {
		gameClient.send(message);
	}, durationMs);
}

/** Durations (ms) for known passive transformations. Tuned for 3–8 seconds — long
 *  enough to feel deliberate, short enough to not frustrate. */
export const PROCESS_DURATIONS = {
	oven: 5000,
	furnace: 7000,
	hotPlate: 4000,
	meker: 6000,
	desikator: 3500,
} as const;

export const PROCESS_LABELS = {
	oven: "Mengeringkan endapan di oven…",
	furnace: "Memijarkan residu di tanur…",
	hotPlate: "Memanaskan larutan di teklu…",
	meker: "Memijarkan residu dengan meker…",
	desikator: "Mendinginkan di desikator…",
} as const;
