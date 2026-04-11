"use client";

import { useEffect, useMemo, useState } from "react";
import type { LevelState } from "@/lib/protocol";

export function LevelOverlay() {
	const [level, setLevel] = useState<LevelState | null>(null);
	const [expanded, setExpanded] = useState(true);
	const [eventText, setEventText] = useState<string | null>(null);

	useEffect(() => {
		const onLevelState = ((e: CustomEvent<LevelState>) => {
			setLevel(e.detail);
			if (e.detail.lastEvent) {
				setEventText(e.detail.lastEvent);
			}
		}) as EventListener;

		window.addEventListener("level-state", onLevelState);
		return () => {
			window.removeEventListener("level-state", onLevelState);
		};
	}, []);

	useEffect(() => {
		if (!eventText) return;
		const timer = window.setTimeout(() => setEventText(null), 2600);
		return () => window.clearTimeout(timer);
	}, [eventText]);

	const completedCount = useMemo(
		() => level?.milestones.filter((m) => m.completed).length ?? 0,
		[level],
	);

	if (!level) return null;

	const progress = Math.round((completedCount / level.milestones.length) * 100);

	return (
		<div className="absolute top-4 right-4 z-40 w-[360px] max-w-[calc(100vw-1.5rem)] pointer-events-auto">
			{eventText && (
				<div className="mb-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 shadow-md animate-pulse">
					{eventText}
				</div>
			)}

			<div className="rounded-2xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur">
				<div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
					<div>
						<p className="text-[11px] uppercase tracking-wide text-neutral-500">Level</p>
						<h3 className="text-sm font-semibold text-neutral-800 leading-tight">
							Penetapan Kadar Tembaga dalam Terusi
						</h3>
					</div>
					<button
						onClick={() => setExpanded((v) => !v)}
						className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
					>
						{expanded ? "Sembunyikan" : "Tampilkan"}
					</button>
				</div>

				<div className="px-4 py-3">
					<div className="mb-2 flex items-center justify-between text-xs">
						<span className="font-medium text-neutral-700">Progress Milestone</span>
						<span className="text-neutral-500">
							{completedCount}/{level.milestones.length}
						</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-neutral-100">
						<div
							className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="mt-2 flex items-center justify-between text-[11px]">
						<span className="text-neutral-500">XP: {level.xp}</span>
						<span className={`font-semibold ${level.finished ? "text-emerald-600" : "text-neutral-500"}`}>
							{level.finished ? "Level Selesai" : "Masih Berjalan"}
						</span>
					</div>
				</div>

				{expanded && (
					<div className="max-h-64 overflow-y-auto border-t border-neutral-100 px-3 py-2">
						{level.milestones.map((m) => (
							<div
								key={m.step}
								className={`mb-1 rounded-lg px-2 py-1.5 text-xs ${m.completed ? "bg-emerald-50 text-emerald-800" : "bg-neutral-50 text-neutral-600"}`}
							>
								<div className="flex items-start gap-2">
									<span className="mt-0.5 text-[10px] font-bold">
										{m.completed ? "OK" : m.step}
									</span>
									<span>{m.title}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
