"use client";

import { useEffect, useMemo, useState } from "react";
import type { LevelState } from "@/lib/protocol";

function useIsCompact() {
	const [compact, setCompact] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 640px), (max-height: 600px)");
		const update = () => setCompact(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);
	return compact;
}

export function LevelOverlay() {
	const [level, setLevel] = useState<LevelState | null>(null);
	const compact = useIsCompact();
	const [expanded, setExpanded] = useState(false);
	const [eventText, setEventText] = useState<string | null>(null);

	useEffect(() => {
		setExpanded(!compact);
	}, [compact]);

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

	if (compact && !expanded) {
		return (
			<div className="absolute top-3 right-3 z-40 pointer-events-auto flex flex-col items-end gap-2">
				{eventText && (
					<div className="max-w-[60vw] rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 shadow-md animate-pulse">
						{eventText}
					</div>
				)}
				<button
					onClick={() => setExpanded(true)}
					className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur"
				>
					<div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
						<div
							className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<span className="text-[11px] font-semibold text-neutral-700">
						{completedCount}/{level.milestones.length}
					</span>
				</button>
			</div>
		);
	}

	return (
		<div
			className="absolute top-3 right-3 z-40 pointer-events-auto flex flex-col items-end gap-2"
			style={{ maxHeight: "calc(100dvh - 1.5rem)", width: "min(360px, calc(100vw - 1.5rem))" }}
		>
			{eventText && (
				<div className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 shadow-md animate-pulse">
					{eventText}
				</div>
			)}

			<div className="flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur">
				<div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-neutral-100 shrink-0">
					<div className="min-w-0">
						<p className="text-[10px] uppercase tracking-wide text-neutral-500">Level</p>
						<h3 className="text-xs font-semibold text-neutral-800 leading-tight truncate">
							Penetapan Kadar Tembaga
						</h3>
					</div>
					<button
						onClick={() => setExpanded((v) => !v)}
						className="rounded-lg border border-neutral-200 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50 shrink-0"
					>
						{expanded ? "Tutup" : "Buka"}
					</button>
				</div>

				<div className="px-3 py-2 shrink-0">
					<div className="mb-1.5 flex items-center justify-between text-[11px]">
						<span className="font-medium text-neutral-700">Progress</span>
						<span className="text-neutral-500">
							{completedCount}/{level.milestones.length} · {progress}%
						</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
						<div
							className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="mt-1.5 flex items-center justify-between text-[10px]">
						<span className="text-neutral-500">XP: {level.xp}</span>
						<span className={`font-semibold ${level.finished ? "text-emerald-600" : "text-neutral-500"}`}>
							{level.finished ? "Selesai" : "Berjalan"}
						</span>
					</div>
				</div>

				{expanded && (
					<div
						className="overflow-y-auto border-t border-neutral-100 px-2 py-2"
						style={{ maxHeight: "min(45dvh, 320px)" }}
					>
						{level.milestones.map((m) => (
							<div
								key={m.step}
								className={`mb-1 rounded-lg px-2 py-1.5 text-[11px] ${m.completed ? "bg-emerald-50 text-emerald-800" : "bg-neutral-50 text-neutral-600"}`}
							>
								<div className="flex items-start gap-2">
									<span className="mt-0.5 text-[10px] font-bold">
										{m.completed ? "OK" : m.step}
									</span>
									<span className="leading-snug">{m.title}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
