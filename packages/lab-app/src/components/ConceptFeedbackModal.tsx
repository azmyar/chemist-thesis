"use client";

import { useEffect, useState } from "react";
import type { ConceptFeedback } from "@/lib/protocol";
import { BuGuru } from "./ui/BuGuru";

export function ConceptFeedbackModal() {
	const [feedback, setFeedback] = useState<ConceptFeedback | null>(null);

	useEffect(() => {
		const onFeedback = ((e: CustomEvent<ConceptFeedback>) => {
			setFeedback(e.detail);
		}) as EventListener;

		window.addEventListener("concept-feedback", onFeedback);
		return () => window.removeEventListener("concept-feedback", onFeedback);
	}, []);

	if (!feedback) return null;

	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
			<div
				className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="concept-feedback-title"
			>
				{/* Header — warning (amber) */}
				<div className="shrink-0 bg-amber-500 px-5 py-4">
					<p className="text-[11px] font-bold uppercase tracking-wide text-white/85">
						Pembetulan Konsep
					</p>
					<h2 id="concept-feedback-title" className="mt-0.5 text-lg font-bold text-white">
						{feedback.title}
					</h2>
				</div>

				{/* Body */}
				<div className="flex gap-4 overflow-y-auto px-5 py-4">
					{/* Bu Guru avatar */}
					<div className="hidden w-24 shrink-0 items-center sm:flex sm:flex-col">
						<BuGuru className="w-20" />
						<span className="mt-1 text-[11px] font-semibold text-neutral-500">Bu Guru</span>
					</div>

					<div className="min-w-0 flex-1 space-y-3">
						{/* speech bubble — kenapa belum bisa lanjut */}
						<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
							<p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
								Bu Guru mengingatkan
							</p>
							<p className="mt-1 text-sm leading-relaxed text-neutral-800">{feedback.why}</p>
						</div>

						{/* yang perlu diperbaiki */}
						<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
							<p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
								Yang perlu diperbaiki
							</p>
							<p className="mt-1 text-sm leading-relaxed text-emerald-900">{feedback.correction}</p>
						</div>

						<p className="text-xs text-neutral-500">
							Konsep: <span className="font-semibold text-neutral-700">{feedback.relatedConcept}</span>
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3">
					<span className="text-xs font-medium text-neutral-400">
						Perbaiki dulu, baru lanjut.
					</span>
					<button
						type="button"
						onClick={() => setFeedback(null)}
						className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-bold text-white hover:bg-neutral-800 active:scale-95"
					>
						Paham, Bu
					</button>
				</div>
			</div>
		</div>
	);
}
