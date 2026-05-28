"use client";

import { useEffect, useState } from "react";
import type { LevelReport } from "@/lib/protocol";
import { getIssueExplanation } from "@/lib/issueExplanations";

function formatSigned(value: number, digits = 2): string {
	const v = Number(value.toFixed(digits));
	if (v > 0) return `+${v.toFixed(digits)}`;
	return v.toFixed(digits);
}

function formatDecision(key: string, value: string | number | boolean): string {
	if (typeof value === "boolean") return value ? "ya" : "tidak";
	return String(value);
}

export function ReportPanel() {
	const [report, setReport] = useState<LevelReport | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onLevelReport = ((e: CustomEvent<LevelReport>) => {
			setReport(e.detail);
			setOpen(true);
		}) as EventListener;

		window.addEventListener("level-report", onLevelReport);
		return () => {
			window.removeEventListener("level-report", onLevelReport);
		};
	}, []);

	if (!open || !report) return null;

	const deviationAbs = Math.abs(report.deviationPercent);
	const deviationTone =
		deviationAbs <= 1 ? "emerald" : deviationAbs <= 3 ? "amber" : "red";
	const toneClass = {
		emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
		amber: "text-amber-700 bg-amber-50 border-amber-200",
		red: "text-red-700 bg-red-50 border-red-200",
	}[deviationTone];

	// Gamified: akurasi → rating bintang (sprite/blok, bukan emoji)
	const stars = deviationAbs <= 1 ? 3 : deviationAbs <= 3 ? 2 : 1;

	const decisionEntries = Object.entries(report.decisions);

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3">
			<div
				className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
				style={{ maxHeight: "calc(100dvh - 1.5rem)" }}
			>
				{/* Header — brand + rating bintang */}
				<div className="shrink-0 bg-primary-500 px-5 py-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-[11px] font-bold uppercase tracking-wide text-white/85">
								Hasil Eksperimen · Praktikum Selesai
							</p>
							<h2 className="mt-0.5 text-lg font-bold text-white">
								Penetapan Kadar Tembaga dalam Terusi
							</h2>
						</div>
						<div className="mt-1 flex shrink-0 items-center gap-1" aria-label={`Akurasi ${stars} dari 3 bintang`}>
							{Array.from({ length: 3 }).map((_, i) => (
								<span
									key={i}
									className={`h-4 w-4 rounded-[4px] ${i < stars ? "bg-amber-300" : "bg-white/25"}`}
								/>
							))}
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-4">
					<section className="mb-4">
						<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
							Perhitungan Kadar
						</h3>
						<div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
							<div className="grid grid-cols-2 gap-y-1">
								<span className="text-neutral-500">m (sampel)</span>
								<span className="text-right font-mono">{report.sampleMassG.toFixed(4)} g</span>
								<span className="text-neutral-500">m (CuO)</span>
								<span className="text-right font-mono">{report.cuoMassG.toFixed(4)} g</span>
								<span className="text-neutral-500">F (Cu/CuO)</span>
								<span className="text-right font-mono">{report.gravimetricFactor.toFixed(4)}</span>
								<span className="text-neutral-500">Rumus</span>
								<span className="text-right font-mono text-[11px] text-neutral-600">
									(m_CuO × F) / m_sampel × 100%
								</span>
							</div>
							<div className="mt-3 grid grid-cols-2 gap-y-1 border-t border-neutral-200 pt-3">
								<span className="font-medium text-neutral-700">Kadar Cu</span>
								<span className="text-right font-mono font-semibold text-neutral-900">
									{report.kadarPercent.toFixed(2)} %
								</span>
								<span className="font-medium text-neutral-700">Teoritis (CuSO₄·5H₂O)</span>
								<span className="text-right font-mono">{report.theoreticalPercent.toFixed(2)} %</span>
							</div>
						</div>

						<div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${toneClass}`}>
							Selisih terhadap teoritis:{" "}
							<span className="font-mono font-semibold">
								{formatSigned(report.deviationPercent)} %
							</span>
						</div>
					</section>

					{report.issues.length > 0 && (
						<section className="mb-4">
							<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
								Analisis Sumber Deviasi
							</h3>
							<div className="space-y-2">
								{report.issues.map((issue) => {
									const exp = getIssueExplanation(issue.code);
									return (
										<div
											key={issue.code}
											className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
										>
											<div className="flex items-start justify-between gap-3">
												<span className="font-medium text-neutral-800">{exp.title}</span>
												{issue.impactMassG !== 0 && (
													<span className="shrink-0 font-mono text-[11px] text-neutral-500">
														{formatSigned(issue.impactMassG, 4)} g
													</span>
												)}
											</div>
											<p className="mt-1 text-[12px] leading-snug text-neutral-600">{exp.why}</p>
											<p className="mt-1 text-[11px] text-neutral-400">
												Konsep: {exp.relatedConcept}
												{exp.relatedSoal ? ` · ${exp.relatedSoal}` : ""}
											</p>
										</div>
									);
								})}
							</div>
						</section>
					)}

					{decisionEntries.length > 0 && (
						<section>
							<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
								Ringkasan Keputusan
							</h3>
							<div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700">
								<ul className="space-y-0.5">
									{decisionEntries.map(([k, v]) => (
										<li key={k} className="flex justify-between gap-2 font-mono">
											<span className="text-neutral-500">{k}</span>
											<span className="text-neutral-800">{formatDecision(k, v)}</span>
										</li>
									))}
								</ul>
							</div>
						</section>
					)}
				</div>

				<div className="flex shrink-0 justify-end border-t border-neutral-100 px-5 py-3">
					<button
						onClick={() => setOpen(false)}
						className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-bold text-white hover:bg-neutral-800 active:scale-95"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
