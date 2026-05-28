"use client";

import { useEffect, useMemo, useState } from "react";
import type { LevelState } from "@/lib/protocol";
import { gameClient } from "@/lib/network/client";
import { ChemistLogomark } from "./ui/ChemistLogomark";

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
	const handleReset = () => {
		if (!level.finished) return;
		const confirmed = window.confirm("Reset praktikum dan mulai lagi dari step 1?");
		if (!confirmed) return;
		window.localStorage.removeItem(`chemist-lab-guided-concepts:${level.levelId}`);
		window.dispatchEvent(new CustomEvent("level-reset"));
		gameClient.send({ type: "reset_level" });
	};

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
					className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur active:scale-95"
				>
					<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-500">
						<ChemistLogomark className="h-3 w-3" />
					</span>
					<div className="relative h-2 w-16 overflow-hidden rounded-full bg-neutral-100">
						<div
							className="h-full rounded-full bg-primary-500 transition-all"
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

			<div className="flex w-full flex-col overflow-hidden rounded-[18px] border border-neutral-200 bg-white/95 shadow-lg backdrop-blur">
				{/* Aksen brand solid */}
				<div className="h-1 w-full bg-primary-500 shrink-0" />

				<div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-neutral-100 shrink-0">
					<div className="flex min-w-0 items-center gap-2">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
							<ChemistLogomark className="h-4 w-4" />
						</span>
						<div className="min-w-0">
							<p className="text-[10px] uppercase tracking-wide text-primary-500 font-semibold">
								Level
							</p>
							<h3 className="text-xs font-semibold text-neutral-800 leading-tight truncate">
								Penetapan Kadar Tembaga
							</h3>
						</div>
					</div>
					<button
						onClick={() => setExpanded((v) => !v)}
						className="rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 active:scale-95 shrink-0"
					>
						{expanded ? "Tutup" : "Buka"}
					</button>
				</div>

				<div className="px-3 py-2.5 shrink-0">
					<div className="mb-1.5 flex items-center justify-between text-[11px]">
						<span className="font-semibold text-neutral-700">Progress</span>
						<span className="text-neutral-500">
							{completedCount}/{level.milestones.length} · {progress}%
						</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-neutral-100">
						<div
							className="h-full rounded-full bg-primary-500 transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="mt-2 flex items-center justify-between">
						<span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
							XP {level.xp}
						</span>
						<span
							className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
								level.finished
									? "bg-emerald-50 text-emerald-600"
									: "bg-neutral-100 text-neutral-500"
							}`}
						>
							{level.finished ? "Selesai" : "Berjalan"}
						</span>
					</div>
					{level.finished && (
						<button
							type="button"
							onClick={handleReset}
							className="mt-2.5 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 active:bg-red-200 active:scale-[0.98]"
						>
							Reset Praktikum
						</button>
					)}
				</div>

				{expanded && (
					<div
						className="overflow-y-auto border-t border-neutral-100 px-2 py-2"
						style={{ maxHeight: "min(45dvh, 320px)" }}
					>
						{level.milestones.map((m) => (
							<div
								key={m.step}
								className={`mb-1 flex items-start gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
									m.completed
										? "bg-emerald-50 text-emerald-800"
										: "bg-neutral-50 text-neutral-600"
								}`}
							>
								<span
									className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
										m.completed
											? "bg-emerald-500 text-white"
											: "border border-neutral-300 bg-white text-neutral-500"
									}`}
								>
									{m.completed ? "✓" : m.step}
								</span>
								<span className="leading-snug">{m.title}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
