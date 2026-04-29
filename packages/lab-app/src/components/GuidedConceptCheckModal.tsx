"use client";

import { useEffect, useMemo, useState } from "react";
import type { LevelReport, LevelState } from "@/lib/protocol";
import {
	FINAL_CONCEPT_CHECK,
	GUIDED_CONCEPT_CHECKS,
	type GuidedConceptCheck,
} from "@/lib/guidedConceptChecks";

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

	return (
		<div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4">
			<div
				className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="guided-check-title"
			>
				<div className="shrink-0 border-b border-blue-100 bg-blue-50 px-5 py-4">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
						Cek Pemahaman Step {active.step}
					</p>
					<h2 id="guided-check-title" className="mt-1 text-lg font-semibold text-neutral-900">
						{active.title}
					</h2>
				</div>

				<div className="overflow-y-auto px-5 py-4">
					<p className="text-sm font-medium leading-relaxed text-neutral-800">{active.question}</p>

					<div className="mt-4 space-y-2">
						{active.options.map((option) => {
							const isSelected = selected === option.id;
							const isCorrect = feedbackState === "correct" && option.id === active.correctOptionId;
							const isWrong = feedbackState === "wrong" && isSelected;
							return (
								<button
									key={option.id}
									type="button"
									onClick={() => {
										setSelected(option.id);
										setFeedbackState("idle");
									}}
									disabled={feedbackState === "correct"}
									className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm leading-snug transition-colors ${
										isCorrect
											? "border-emerald-300 bg-emerald-50 text-emerald-900"
											: isWrong
												? "border-red-300 bg-red-50 text-red-900"
												: isSelected
													? "border-blue-400 bg-blue-50 text-blue-900"
													: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
									}`}
								>
									{option.text}
								</button>
							);
						})}
					</div>

					{feedbackState === "wrong" && (
						<p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
							Jawaban belum tepat. Baca lagi alasan prosedurnya, lalu pilih jawaban yang menjelaskan hubungan kimianya.
						</p>
					)}

					{feedbackState === "correct" && (
						<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
							<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
								Pemahaman Terkunci
							</p>
							<p className="mt-1 text-sm leading-relaxed text-emerald-900">{active.explanation}</p>
							<p className="mt-2 text-xs text-emerald-700">
								Konsep: <span className="font-medium">{active.relatedConcept}</span>
							</p>
						</div>
					)}
				</div>

				<div className="flex shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-3">
					{feedbackState === "correct" ? (
						<button
							type="button"
							onClick={continueNext}
							className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
						>
							Lanjut
						</button>
					) : (
						<button
							type="button"
							onClick={submit}
							disabled={!selected}
							className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Cek Jawaban
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
