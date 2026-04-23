/**
 * Registry of issue codes emitted by the server during the experiment,
 * mapped to student-facing explanations shown in the final ReportPanel.
 *
 * Keep entries concise — 1–2 sentences for `why` matching the formal
 * analytical chemistry phrasing used in the posttest so students recognize
 * the concept when they encounter it in assessment.
 *
 * Grows incrementally: only add an entry when the corresponding server
 * handler actually emits the code. Unknown codes render with a fallback.
 */

export interface IssueExplanation {
	title: string;
	why: string;
	relatedConcept: string;
	relatedSoal?: string;
}

export const ISSUE_EXPLANATIONS: Record<string, IssueExplanation> = {
	"weigh.out_of_range": {
		title: "Massa sampel di luar rentang kerja (0,45–0,55 g)",
		why: "Rentang ini dipilih agar massa CuO hasil pijar jatuh pada orde yang masih dapat ditimbang dengan presisi neraca analitik dan tidak melampaui kapasitas krus. Massa terlalu kecil memperbesar kesalahan relatif penimbangan; massa terlalu besar memperbesar risiko pengendapan tidak sempurna dan kelebihan kapasitas wadah pijar.",
		relatedConcept: "Akurasi dan presisi gravimetri",
	},
	"weigh.non_canonical_container": {
		title: "Penimbangan dilakukan tanpa kaca arloji",
		why: "Kaca arloji dipakai sebagai wadah penimbangan karena massanya stabil, inert terhadap sampel higroskopis, dan memudahkan pemindahan sampel ke piala gelas tanpa kehilangan. Menimbang langsung pada wadah reaksi dapat menambah sumber kesalahan pemindahan dan kontaminasi.",
		relatedConcept: "Teknik penimbangan analitik",
	},
	"dissolve.insufficient_water": {
		title: "Volume pelarut terlalu sedikit",
		why: "Pelarutan sampel terusi memerlukan volume air suling yang cukup (≈100 mL) agar seluruh Cu²⁺ terlarut sempurna dan konsentrasinya memadai untuk pengendapan yang kasar dan mudah disaring. Volume terlalu kecil dapat menyebabkan pelarutan tidak sempurna dan endapan halus saat NaOH ditambahkan.",
		relatedConcept: "Pelarutan dan konsentrasi larutan induk",
	},
	"acidify.insufficient": {
		title: "Volume H2SO4 terlalu sedikit",
		why: "Pengasaman bertujuan mencegah hidrolisis ion Cu²⁺ menjadi Cu(OH)₂ koloid saat pendidihan. Jumlah asam yang terlalu sedikit dapat membuat larutan belum cukup asam sehingga sebagian Cu²⁺ tetap terhidrolisis, menghasilkan endapan koloid halus yang sulit disaring.",
		relatedConcept: "Pengasaman pra-pendidihan",
		relatedSoal: "Post-test #1",
	},
	"boil.no_acidify": {
		title: "Pendidihan dilakukan tanpa pengasaman H2SO4",
		why: "Jika larutan CuSO₄ dipanaskan tanpa pengasaman terlebih dahulu, sebagian ion Cu²⁺ akan terhidrolisis membentuk Cu(OH)₂ koloid sebelum NaOH ditambahkan. Endapan koloid ini halus, sulit disaring, dan berpotensi bocor melalui kertas saring — kadar Cu akhir akan tampak lebih rendah dari nilai sebenarnya.",
		relatedConcept: "Urutan pengasaman–pendidihan–pengendapan",
		relatedSoal: "Post-test #1",
	},
	"precipitate.nh4oh_complex": {
		title: "Pereaksi pengendap NH4OH (amonia)",
		why: "Ion Cu²⁺ bereaksi dengan NH₃ berlebih membentuk ion kompleks tetraamintembaga(II) [Cu(NH₃)₄]²⁺ yang larut dalam air. Akibatnya pengendapan Cu(OH)₂ tidak terjadi secara sempurna — sebagian besar Cu tetap berada dalam larutan dan tidak terukur pada massa residu pijar. Kadar Cu yang diperoleh akan jauh lebih rendah dari nilai sebenarnya.",
		relatedConcept: "Pembentukan ion kompleks vs pengendapan hidroksida",
		relatedSoal: "Pre-test #5",
	},
	"precipitate.koh_residue": {
		title: "Pereaksi pengendap KOH",
		why: "KOH dapat mengendapkan Cu²⁺ menjadi Cu(OH)₂, namun sisa KOH yang tidak tercuci tuntas tidak menguap sempurna pada pemijaran — terbentuk K₂O/K₂CO₃ yang tetap berada di krus. Massa residu pijar menjadi lebih besar dan kadar Cu tampak lebih tinggi dari nilai sebenarnya.",
		relatedConcept: "Pemilihan pereaksi pengendap yang residu pijarnya habis",
		relatedSoal: "Post-test #3",
	},
	"precipitate.too_concentrated": {
		title: "NaOH yang digunakan terlalu pekat (8N)",
		why: "Pereaksi pengendap dengan konsentrasi tinggi menghasilkan supersaturasi lokal yang memicu pembentukan banyak inti kristal sekaligus — endapan yang dihasilkan menjadi halus (koloid) dan sulit disaring. Pereaksi yang lebih encer (1N) menghasilkan kristal yang lebih kasar, lebih berat, dan mengurangi risiko co-presipitasi pengotor.",
		relatedConcept: "Ukuran kristal endapan vs konsentrasi pereaksi",
		relatedSoal: "Post-test #5",
	},
	"precipitate.rapid_addition": {
		title: "Pereaksi pengendap ditambahkan sekaligus",
		why: "Penambahan pengendap secara cepat/sekaligus menghasilkan supersaturasi tinggi yang menyebabkan endapan yang terbentuk halus dan koloid — sulit disaring serta berpotensi bocor dari kertas saring. Penambahan sedikit demi sedikit dalam kondisi mendidih menghasilkan endapan yang kasar, berat, dan mudah disaring.",
		relatedConcept: "Teknik penambahan pengendap (tetes demi tetes)",
		relatedSoal: "Pre-test #11",
	},
};

export function getIssueExplanation(code: string): IssueExplanation {
	return (
		ISSUE_EXPLANATIONS[code] ?? {
			title: `Catatan: ${code}`,
			why: "Penjelasan untuk isu ini belum tersedia.",
			relatedConcept: "—",
		}
	);
}
