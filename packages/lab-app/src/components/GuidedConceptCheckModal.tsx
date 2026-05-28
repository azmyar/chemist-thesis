"use client";

import { useEffect, useMemo, useState } from "react";
import type { LevelReport, LevelState } from "@/lib/protocol";
import {
	FINAL_CONCEPT_CHECK,
	GUIDED_CONCEPT_CHECKS,
	type GuidedConceptCheck,
} from "@/lib/guidedConceptChecks";
import { BuGuru } from "./ui/BuGuru";

type FeedbackState = "idle" | "wrong" | "correct";

function storageKey(levelId: string): string {
	return `chemist-lab-guided-concepts:${levelId}`;
}

function readMastered(levelId: string): Set<number> {
	if (typeof window === "undefined") return new Set();
	const raw = window.localStorage.getItem(storageKey(levelId));
	if (!raw) return new Set();
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return new Set();
		return new Set(parsed.filter((v): v is number => typeof v === "number"));
	} catch {
		return new Set();
	}
}

function writeMastered(levelId: string, mastered: Set<number>): void {
	window.localStorage.setItem(storageKey(levelId), JSON.stringify([...mastered].sort((a, b) => a - b)));
}

export function GuidedConceptCheckModal() {
	const [levelId, setLevelId] = useState<string | null>(null);
	const [queue, setQueue] = useState<GuidedConceptCheck[]>([]);
	const [active, setActive] = useState<GuidedConceptCheck | null>(null);
	const [selected, setSelected] = useState<string | null>(null);
	const [feedbackState, setFeedbackState] = useState<FeedbackState>("idle");

	const checksByStep = useMemo(() => {
		const map = new Map<number, GuidedConceptCheck>();
		for (const check of GUIDED_CONCEPT_CHECKS) map.set(check.step, check);
		map.set(FINAL_CONCEPT_CHECK.step, FINAL_CONCEPT_CHECK);
		return map;
	}, []);

	// Source data always lists the correct answer first ("a"). Shuffle the
	// option order whenever a new question becomes active so the correct
	// choice is not always at the top.
	const displayedOptions = useMemo(() => {
		if (!active) return [];
		const arr = [...active.options];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}, [active]);

	useEffect(() => {
		if (active || queue.length === 0) return;
		setActive(queue[0]);
		setQueue((prev) => prev.slice(1));
		setSelected(null);
		setFeedbackState("idle");
	}, [active, queue]);

	useEffect(() => {
		const enqueueChecks = (nextLevelId: string, steps: number[]) => {
			const mastered = readMastered(nextLevelId);
			const pending = steps
				.filter((step) => !mastered.has(step))
				.map((step) => checksByStep.get(step))
				.filter((check): check is GuidedConceptCheck => Boolean(check));

			if (pending.length === 0) return;
			setLevelId(nextLevelId);
			setQueue((prev) => {
				const existing = new Set([
					...(active ? [active.step] : []),
					...prev.map((check) => check.step),
				]);
				const additions = pending.filter((check) => !existing.has(check.step));
				return [...prev, ...additions];
			});
		};

		const onLevelState = ((e: CustomEvent<LevelState>) => {
			const completedSteps = e.detail.milestones
				.filter((milestone) => milestone.completed)
				.map((milestone) => milestone.step);
			enqueueChecks(e.detail.levelId, completedSteps);
		}) as EventListener;

		const onLevelReport = ((e: CustomEvent<LevelReport>) => {
			enqueueChecks(e.detail.levelId, [FINAL_CONCEPT_CHECK.step]);
		}) as EventListener;

		window.addEventListener("level-state", onLevelState);
		window.addEventListener("level-report", onLevelReport);
		return () => {
			window.removeEventListener("level-state", onLevelState);
			window.removeEventListener("level-report", onLevelReport);
		};
	}, [active, checksByStep]);

	if (!active || !levelId) return null;

	const submit = () => {
		if (!selected) return;
		if (selected !== active.correctOptionId) {
			setFeedbackState("wrong");
			return;
		}

		const mastered = readMastered(levelId);
		mastered.add(active.step);
		writeMastered(levelId, mastered);
		setFeedbackState("correct");
	};

	const continueNext = () => {
		setActive(null);
		setSelected(null);
		setFeedbackState("idle");
	};

	// ── Gamified progress: berapa konsep sudah "terkunci" di level ini ──
	const totalChecks = checksByStep.size;
	const masteredCount = Math.min(totalChecks, readMastered(levelId).size);

	return (
		<div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4">
			<div
				className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="guided-check-title"
			>
				{/* Header */}
				<div className="shrink-0 bg-primary-500 px-5 py-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-[11px] font-bold uppercase tracking-wide text-white/80">
								Cek Pemahaman
							</p>
							<h2
								id="guided-check-title"
								className="mt-0.5 truncate text-lg font-bold text-white"
							>
								Step {active.step} — {active.title}
							</h2>
						</div>
						{/* progress pips — konsep terkunci */}
						<div
							className="mt-1 flex shrink-0 items-center gap-1.5"
							aria-label={`${masteredCount} dari ${totalChecks} konsep terkunci`}
						>
							{Array.from({ length: totalChecks }).map((_, i) => (
								<span
									key={i}
									className={`h-2.5 w-2.5 rounded-full ${
										i < masteredCount ? "bg-amber-300" : "bg-white/30"
									}`}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Body */}
				<div className="flex gap-4 overflow-y-auto px-5 py-4">
					{/* Bu Guru avatar */}
					<div className="hidden w-24 shrink-0 items-center sm:flex sm:flex-col">
						<BuGuru className="w-20" />
						<span className="mt-1 text-[11px] font-semibold text-neutral-500">Bu Guru</span>
					</div>

					{/* Soal + opsi */}
					<div className="min-w-0 flex-1">
						{/* speech bubble */}
						<div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3">
							<p className="text-[11px] font-bold uppercase tracking-wide text-primary-700">
								Bu Guru bertanya
							</p>
							<p className="mt-1 text-base font-semibold leading-snug text-neutral-900">
								{active.question}
							</p>
						</div>

						{/* opsi jawaban */}
						<div className="mt-3 space-y-2">
							{displayedOptions.map((option, i) => {
								const isSelected = selected === option.id;
								const isCorrect = feedbackState === "correct" && option.id === active.correctOptionId;
								const isWrong = feedbackState === "wrong" && isSelected;
								const letter = String.fromCharCode(65 + i);
								return (
									<button
										key={option.id}
										type="button"
										onClick={() => {
											setSelected(option.id);
											setFeedbackState("idle");
										}}
										disabled={feedbackState === "correct"}
										className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm leading-snug transition-colors ${
											isCorrect
												? "border-emerald-300 bg-emerald-50 text-emerald-900"
												: isWrong
													? "border-red-300 bg-red-50 text-red-900"
													: isSelected
														? "border-primary-400 bg-primary-50 text-primary-800"
														: "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
										}`}
									>
										<span
											className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
												isCorrect
													? "bg-emerald-500 text-white"
													: isWrong
														? "bg-red-500 text-white"
														: isSelected
															? "bg-primary-500 text-white"
															: "bg-neutral-100 text-neutral-500"
											}`}
										>
											{letter}
										</span>
										<span className="flex-1">{option.text}</span>
									</button>
								);
							})}
						</div>

						{feedbackState === "wrong" && (
							<p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
								Belum tepat. Bu Guru bilang: baca lagi alasan prosedurnya, lalu pilih jawaban yang menjelaskan hubungan kimianya.
							</p>
						)}

						{feedbackState === "correct" && (
							<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
								<div className="flex items-center gap-2">
									{/* bintang reward — blok, bukan emoji */}
									<span className="flex items-center gap-1">
										<span className="h-3.5 w-3.5 rounded-[3px] bg-amber-400" />
										<span className="h-3.5 w-3.5 rounded-[3px] bg-amber-400" />
										<span className="h-3.5 w-3.5 rounded-[3px] bg-amber-400" />
									</span>
									<p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
										Pemahaman terkunci · +10 XP
									</p>
								</div>
								<p className="mt-2 text-sm leading-relaxed text-emerald-900">{active.explanation}</p>
								<p className="mt-2 text-xs text-emerald-700">
									Konsep: <span className="font-semibold">{active.relatedConcept}</span>
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3">
					{feedbackState === "correct" ? (
						<>
							<span className="text-xs font-medium text-neutral-400">
								Mantap! Lanjut praktikum.
							</span>
							<button
								type="button"
								onClick={continueNext}
								className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-bold text-white hover:bg-neutral-800 active:scale-95"
							>
								Lanjut →
							</button>
						</>
					) : (
						<>
							<span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
								<span className="h-3 w-3 rounded-[3px] bg-amber-400" />
								Jawab benar = +10 XP
							</span>
							<button
								type="button"
								onClick={submit}
								disabled={!selected}
								className="rounded-xl bg-primary-500 px-5 py-2 text-sm font-bold text-white hover:bg-primary-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Cek Jawaban
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
