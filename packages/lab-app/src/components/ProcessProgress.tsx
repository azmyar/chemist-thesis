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
			<div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
				{/* Header strip — brand */}
				<div className="bg-primary-500 px-5 py-3">
					<p className="text-[11px] font-bold uppercase tracking-wide text-white/85">
						Proses Berjalan
					</p>
					<h3 className="mt-0.5 text-base font-bold text-white">{state.label}</h3>
				</div>

				<div className="px-5 py-4">
					<div className="h-3 overflow-hidden rounded-full bg-neutral-100">
						<div
							className="h-full rounded-full bg-primary-500 transition-[width]"
							style={{ width: `${pct}%` }}
						/>
					</div>

					<div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
						<span className="font-semibold text-primary-600">{pct.toFixed(0)}%</span>
						<span className="font-mono tabular-nums">sisa {remainingSec}s</span>
					</div>
				</div>
			</div>
		</div>
	);
}
