export interface GuidedConceptOption {
	id: string;
	text: string;
}

export interface GuidedConceptCheck {
	step: number;
	title: string;
	question: string;
	options: GuidedConceptOption[];
	correctOptionId: string;
	explanation: string;
	relatedConcept: string;
}

export const GUIDED_CONCEPT_CHECKS: GuidedConceptCheck[] = [
	{
		step: 1,
		title: "Penimbangan Sampel",
		question: "Mengapa sampel terusi harus ditimbang sekitar 0,45-0,55 g pada kaca arloji?",
		options: [
			{ id: "a", text: "Agar massa sampel berada pada rentang kerja yang presisi dan mudah dipindahkan tanpa kehilangan." },
			{ id: "b", text: "Agar CuO hasil pijar selalu tepat 0,5000 g." },
			{ id: "c", text: "Agar sampel bereaksi langsung dengan kaca arloji." },
		],
		correctOptionId: "a",
		explanation: "Rentang kerja mengurangi kesalahan relatif penimbangan, sedangkan kaca arloji memudahkan transfer sampel ke piala gelas tanpa kontaminasi atau kehilangan.",
		relatedConcept: "Teknik penimbangan analitik",
	},
	{
		step: 2,
		title: "Pelarutan Sampel",
		question: "Apa tujuan melarutkan terusi dengan sekitar 100 mL air suling di piala gelas?",
		options: [
			{ id: "a", text: "Agar semua Cu2+ terlarut merata dan siap diendapkan secara terkendali." },
			{ id: "b", text: "Agar air menambah massa CuO saat pemijaran." },
			{ id: "c", text: "Agar CuSO4 berubah langsung menjadi CuO tanpa pereaksi lain." },
		],
		correctOptionId: "a",
		explanation: "Pelarutan sempurna membuat Cu2+ tersebar homogen. Volume yang terlalu kecil dapat membuat pelarutan dan pengendapan tidak terkendali.",
		relatedConcept: "Pelarutan dan konsentrasi larutan induk",
	},
	{
		step: 3,
		title: "Pengasaman",
		question: "Mengapa H2SO4 ditambahkan sebelum larutan dipanaskan?",
		options: [
			{ id: "a", text: "Untuk mencegah hidrolisis Cu2+ menjadi Cu(OH)2 koloid saat pendidihan." },
			{ id: "b", text: "Untuk membuat Cu2+ menguap sebelum disaring." },
			{ id: "c", text: "Untuk melarutkan kertas saring agar abu berkurang." },
		],
		correctOptionId: "a",
		explanation: "Tanpa pengasaman, pemanasan dapat memicu hidrolisis Cu2+. Endapan koloid yang terbentuk akan halus dan sulit disaring.",
		relatedConcept: "Urutan pengasaman-pendidihan-pengendapan",
	},
	{
		step: 4,
		title: "Pendidihan",
		question: "Mengapa larutan dididihkan sebelum pengendapan dengan NaOH?",
		options: [
			{ id: "a", text: "Agar endapan yang terbentuk lebih kasar, berat, dan mudah disaring." },
			{ id: "b", text: "Agar semua Cu2+ hilang sebagai gas." },
			{ id: "c", text: "Agar NaOH tidak diperlukan lagi." },
		],
		correctOptionId: "a",
		explanation: "Pengendapan dalam kondisi panas membantu pembentukan endapan gravimetri yang lebih baik dan mengurangi risiko partikel halus.",
		relatedConcept: "Pembentukan endapan gravimetri",
	},
	{
		step: 5,
		title: "Pengendapan",
		question: "Mengapa NaOH harus ditambahkan sedikit demi sedikit sambil diaduk?",
		options: [
			{ id: "a", text: "Untuk menghindari supersaturasi lokal yang menghasilkan endapan halus/koloid." },
			{ id: "b", text: "Karena NaOH akan menguap jika dituang pelan." },
			{ id: "c", text: "Agar Cu2+ tetap berada dalam larutan sampai akhir." },
		],
		correctOptionId: "a",
		explanation: "Penambahan cepat menyebabkan banyak inti endapan terbentuk sekaligus. Endapan menjadi halus, sulit disaring, dan bisa bocor dari kertas saring.",
		relatedConcept: "Supersaturasi dan ukuran partikel endapan",
	},
	{
		step: 6,
		title: "Uji Pengendapan Sempurna",
		question: "Pada prosedur ini, indikator apa yang menunjukkan pengendapan Cu(OH)2 sudah cukup sempurna sebelum filtrasi?",
		options: [
			{ id: "a", text: "Kertas lakmus merah berubah biru, menandakan larutan sudah basa setelah pengendap ditambahkan." },
			{ id: "b", text: "Kertas saring sudah bebas abu sehingga filtrasi pasti sempurna." },
			{ id: "c", text: "CuO sudah mencapai bobot tetap setelah pemijaran." },
		],
		correctOptionId: "a",
		explanation: "Perubahan lakmus merah menjadi biru menunjukkan suasana basa/kelebihan pengendap sudah tercapai, sehingga Cu2+ dalam larutan induk seharusnya sudah mengendap sebagai Cu(OH)2.",
		relatedConcept: "Kelengkapan pengendapan",
	},
	{
		step: 7,
		title: "Filtrasi",
		question: "Jika endapan CuO kasar dan cepat mengendap, kertas saring seperti apa yang lebih optimal?",
		options: [
			{ id: "a", text: "Pori lebih besar seperti Whatman 541 agar filtrasi lebih cepat tanpa kehilangan endapan kasar." },
			{ id: "b", text: "Pori sehalus mungkin karena selalu lebih akurat untuk semua endapan." },
			{ id: "c", text: "Kertas biasa karena akan habis seluruhnya saat pemijaran." },
		],
		correctOptionId: "a",
		explanation: "Pemilihan filter mengikuti sifat endapan. Endapan kasar cocok dengan pori lebih besar, sedangkan endapan halus membutuhkan pori lebih kecil.",
		relatedConcept: "Ukuran endapan dan pemilihan filter",
	},
	{
		step: 8,
		title: "Pencucian Endapan",
		question: "Mengapa endapan dicuci dengan air suling, bukan larutan NaOH?",
		options: [
			{ id: "a", text: "Untuk menghilangkan pengotor larut tanpa meninggalkan residu basa yang menambah massa pijar." },
			{ id: "b", text: "Agar CuO larut seluruhnya sehingga filtrat menjadi biru." },
			{ id: "c", text: "Agar kertas saring berubah menjadi CuSO4." },
		],
		correctOptionId: "a",
		explanation: "Sisa basa atau garam yang tertahan dapat menambah massa residu dan menyebabkan kadar Cu tampak terlalu tinggi.",
		relatedConcept: "Pencucian endapan gravimetri",
	},
	{
		step: 9,
		title: "Uji Sulfat",
		question: "Jika filtrat cucian masih memberi endapan putih BaSO4 saat diberi BaCl2, apa tindakan yang benar?",
		options: [
			{ id: "a", text: "Lanjutkan pencucian sampai uji sulfat negatif." },
			{ id: "b", text: "Langsung pijarkan karena sulfat pasti menguap sempurna." },
			{ id: "c", text: "Tambahkan NH4OH agar sulfat menjadi CuO." },
		],
		correctOptionId: "a",
		explanation: "Sulfat tersisa dapat terbawa ke residu pijar dan menaikkan massa akhir. Karena itu pencucian harus dilanjutkan.",
		relatedConcept: "Pengotor sulfat dan error positif",
	},
	{
		step: 10,
		title: "Uji Basa",
		question: "Pada tahap uji basa setelah pencucian, bagian mana yang diuji dengan kertas lakmus?",
		options: [
			{ id: "a", text: "Filtrat atau cairan cucian, karena itu menunjukkan apakah sisa basa masih terbawa dari endapan." },
			{ id: "b", text: "Kaca arloji kosong, karena kaca arloji akan menyerap basa." },
			{ id: "c", text: "CuO hasil pijar, karena lakmus dipakai setelah furnace." },
		],
		correctOptionId: "a",
		explanation: "Uji basa dilakukan pada filtrat/cairan cucian. Jika filtrat masih basa, pencucian belum cukup dan residu basa dapat mengganggu massa akhir.",
		relatedConcept: "Kemurnian endapan",
	},
	{
		step: 11,
		title: "Pengeringan",
		question: "Mengapa endapan perlu dikeringkan di oven sebelum pemijaran?",
		options: [
			{ id: "a", text: "Untuk menghilangkan air sehingga pemijaran lebih stabil dan massa akhir lebih dapat dipercaya." },
			{ id: "b", text: "Untuk mengubah semua CuO menjadi CuSO4 kembali." },
			{ id: "c", text: "Untuk menambah massa endapan sebelum dihitung." },
		],
		correctOptionId: "a",
		explanation: "Pengeringan mengurangi air fisik sebelum tahap suhu tinggi, sehingga proses pemijaran dan penimbangan berikutnya lebih konsisten.",
		relatedConcept: "Pengeringan sebelum pemijaran",
	},
	{
		step: 12,
		title: "Pemijaran dan Desikator",
		question: "Mengapa residu harus didinginkan dalam desikator sebelum ditimbang?",
		options: [
			{ id: "a", text: "Agar residu dingin tanpa menyerap uap air dari udara." },
			{ id: "b", text: "Agar CuO larut dalam udara." },
			{ id: "c", text: "Agar neraca membaca massa lebih kecil secara sengaja." },
		],
		correctOptionId: "a",
		explanation: "Benda panas dapat menyebabkan pembacaan neraca tidak stabil, dan residu dapat menyerap kelembapan jika didinginkan di udara terbuka.",
		relatedConcept: "Pendinginan dan stabilitas massa",
	},
	{
		step: 13,
		title: "Penimbangan CuO",
		question: "Mengapa massa yang ditimbang adalah CuO hasil pijar?",
		options: [
			{ id: "a", text: "Karena CuO adalah bentuk akhir yang stabil untuk mengonversi massa residu menjadi massa Cu." },
			{ id: "b", text: "Karena CuO selalu lebih ringan dari semua pengotor." },
			{ id: "c", text: "Karena CuO tidak perlu faktor gravimetri." },
		],
		correctOptionId: "a",
		explanation: "Dalam metode ini, massa Cu dihitung dari massa CuO menggunakan faktor gravimetri Cu/CuO.",
		relatedConcept: "Faktor gravimetri Cu/CuO",
	},
	{
		step: 14,
		title: "Bobot Tetap",
		question: "Kapan bobot tetap dinyatakan tercapai?",
		options: [
			{ id: "a", text: "Saat selisih dua penimbangan berurutan setelah pijar-dingin-timbang berada dalam batas toleransi." },
			{ id: "b", text: "Saat massa residu menjadi nol." },
			{ id: "c", text: "Saat warna endapan berubah menjadi biru." },
		],
		correctOptionId: "a",
		explanation: "Bobot tetap menunjukkan air, karbon, dan perubahan massa lain sudah minimal sehingga massa CuO dapat dipakai untuk perhitungan kadar.",
		relatedConcept: "Validitas massa akhir",
	},
];

export const FINAL_CONCEPT_CHECK: GuidedConceptCheck = {
	step: 15,
	title: "Perhitungan dan Interpretasi",
	question: "Rumus manakah yang digunakan untuk menghitung kadar Cu dari massa CuO?",
	options: [
		{ id: "a", text: "(massa CuO x 0,7987 / massa sampel) x 100%" },
		{ id: "b", text: "(massa sampel x 0,7987 / massa CuO) x 100%" },
		{ id: "c", text: "(massa CuO + massa sampel) x 100%" },
	],
	correctOptionId: "a",
	explanation: "Faktor 0,7987 adalah perbandingan massa atom Cu terhadap massa molar CuO, sehingga massa CuO dikonversi menjadi massa Cu.",
	relatedConcept: "Perhitungan kadar Cu",
};
