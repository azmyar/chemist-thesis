"use client";

import { useEffect, useState } from "react";
import type { ConceptFeedback } from "@/lib/protocol";

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
				className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="concept-feedback-title"
			>
				<div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
						Pembetulan Konsep
					</p>
					<h2 id="concept-feedback-title" className="mt-1 text-lg font-semibold text-neutral-900">
						{feedback.title}
					</h2>
				</div>

				<div className="space-y-4 px-5 py-4">
					<section>
						<h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
							Mengapa belum bisa lanjut
						</h3>
						<p className="mt-1 text-sm leading-relaxed text-neutral-700">{feedback.why}</p>
					</section>

					<section className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
							Yang perlu diperbaiki
						</h3>
						<p className="mt-1 text-sm leading-relaxed text-emerald-900">{feedback.correction}</p>
					</section>

					<p className="text-xs text-neutral-500">
						Konsep: <span className="font-medium text-neutral-700">{feedback.relatedConcept}</span>
					</p>
				</div>

				<div className="flex justify-end border-t border-neutral-100 px-5 py-3">
					<button
						type="button"
						onClick={() => setFeedback(null)}
						className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
					>
						Pahami
					</button>
				</div>
			</div>
		</div>
	);
}
