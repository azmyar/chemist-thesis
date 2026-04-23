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

	const decisionEntries = Object.entries(report.decisions);

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3">
			<div
				className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
				style={{ maxHeight: "calc(100dvh - 1.5rem)" }}
			>
				<div className="px-5 py-4 border-b border-neutral-100 shrink-0">
					<p className="text-[11px] uppercase tracking-wide text-neutral-500">Hasil Eksperimen</p>
					<h2 className="text-lg font-semibold text-neutral-800">
						Penetapan Kadar Tembaga dalam Terusi
					</h2>
				</div>

				<div className="px-5 py-4 overflow-y-auto flex-1">
					<section className="mb-4">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
							Perhitungan Kadar
						</h3>
						<div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
							<div className="grid grid-cols-2 gap-y-1">
								<span className="text-neutral-500">m (sampel)</span>
								<span className="font-mono text-right">{report.sampleMassG.toFixed(4)} g</span>
								<span className="text-neutral-500">m (CuO)</span>
								<span className="font-mono text-right">{report.cuoMassG.toFixed(4)} g</span>
								<span className="text-neutral-500">F (Cu/CuO)</span>
								<span className="font-mono text-right">{report.gravimetricFactor.toFixed(4)}</span>
								<span className="text-neutral-500">Rumus</span>
								<span className="font-mono text-right text-[11px] text-neutral-600">
									(m_CuO × F) / m_sampel × 100%
								</span>
							</div>
							<div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-y-1">
								<span className="text-neutral-700 font-medium">Kadar Cu</span>
								<span className="font-mono text-right font-semibold text-neutral-900">
									{report.kadarPercent.toFixed(2)} %
								</span>
								<span className="text-neutral-700 font-medium">Teoritis (CuSO₄·5H₂O)</span>
								<span className="font-mono text-right">{report.theoreticalPercent.toFixed(2)} %</span>
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
							<h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
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
													<span className="text-[11px] font-mono text-neutral-500 shrink-0">
														{formatSigned(issue.impactMassG, 4)} g
													</span>
												)}
											</div>
											<p className="mt-1 text-[12px] text-neutral-600 leading-snug">{exp.why}</p>
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
							<h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
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

				<div className="px-5 py-3 border-t border-neutral-100 flex justify-end shrink-0">
					<button
						onClick={() => setOpen(false)}
						className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-white font-medium"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
