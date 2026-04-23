"use client";

import { useEffect, useState } from "react";

interface ProcessState {
	label: string;
	durationMs: number;
	startedAt: number;
}

/**
 * Full-screen progress overlay for passive transformations (boil, dry, calcine,
 * cool). Listens for `process-start` CustomEvent with `{ label, durationMs }`,
 * renders an animated progress bar, auto-dismisses after the duration.
 *
 * Why: otherwise these steps feel "instant" and students miss that these are
 * time-consuming physical processes in real lab practice.
 */
export function ProcessProgress() {
	const [state, setState] = useState<ProcessState | null>(null);
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		const onStart = ((e: CustomEvent<{ label: string; durationMs: number }>) => {
			setState({ ...e.detail, startedAt: performance.now() });
			setElapsed(0);
		}) as EventListener;

		window.addEventListener("process-start", onStart);
		return () => window.removeEventListener("process-start", onStart);
	}, []);

	useEffect(() => {
		if (!state) return;
		let raf = 0;
		const tick = () => {
			const now = performance.now();
			const dt = now - state.startedAt;
			setElapsed(dt);
			if (dt >= state.durationMs) {
				setState(null);
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [state]);

	if (!state) return null;

	const pct = Math.min(100, (elapsed / state.durationMs) * 100);
	const remainingMs = Math.max(0, state.durationMs - elapsed);
	const remainingSec = (remainingMs / 1000).toFixed(1);

	return (
		<div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/55 p-4">
			<div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl px-5 py-6">
				<p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Proses Berjalan</p>
				<h3 className="text-base font-semibold text-neutral-800 mb-4">{state.label}</h3>

				<div className="h-2 overflow-hidden rounded-full bg-neutral-100">
					<div
						className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-[width]"
						style={{ width: `${pct}%` }}
					/>
				</div>

				<div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
					<span>{pct.toFixed(0)}%</span>
					<span className="font-mono tabular-nums">sisa {remainingSec}s</span>
				</div>
			</div>
		</div>
	);
}
