import { DurableObject } from "cloudflare:workers";
import {
	type ClientMessage,
	type ConceptFeedback,
	type ContainerContent,
	type DecisionValue,
	type Direction,
	type GameObjectState,
	type HeldItem,
	type InventoryItem,
	type LabContainerMeta,
	type LevelReport,
	type LevelState,
	type PlayerState,
	type ReportIssue,
	type ServerMessage,
	ROOM_CONFIG,
	clientMessageSchema,
} from "@chemist/shared";

interface PlayerConnection {
	ws: WebSocket;
	state: PlayerState;
}

interface PlayerSocketAttachment {
	playerState: PlayerState;
}

interface RateWindow {
	count: number;
	windowStart: number;
}

const MAX_HOLD = 2;
const MOVE_MAX_DISTANCE_PER_MSG = 64;
const PLAYER_ID_REGEX = /^[a-z0-9-]{4,64}$/;
const LEVEL_ID = "gravimetri-terusi";
const LEVEL_TITLE = "Penetapan Kadar Tembaga dalam Terusi - Metode Gravimetri";
const CUO_FROM_TERUSI_RATIO = 0.3186;
const CUOH2_FROM_TERUSI_RATIO = 0.3907;
const GRAVIMETRIC_FACTOR_CU_CUO = 0.7987;
const THEORETICAL_CU_PERCENT = 25.45;
const TEST_TUBE_MAX_VOLUME_ML = 20;
const SULFATE_TEST_REAGENT_ML = 1;

const LEVEL_MILESTONES = [
	"Timbang terusi ±0,5g ke kaca arloji",
	"Larutkan terusi dengan 100mL air suling di piala gelas",
	"Tambahkan H2SO4 4N sampai larutan biru jernih",
	"Didihkan larutan di teklu",
	"Endapkan dengan NaOH 4N sambil diaduk",
	"Uji pengendapan sempurna",
	"Saring endapan lewat setup corong + kertas saring + piala penampung",
	"Cuci endapan dengan air suling",
	"Uji pengotor sulfat (HCl + BaCl2)",
	"Uji basa dengan kertas lakmus",
	"Keringkan endapan di oven",
	"Pindahkan ke krus, arangkan di teklu, pijarkan di meker, lalu dinginkan",
	"Timbang residu CuO",
	"Ulangi pijar-dingin-timbang sampai bobot tetap",
] as const;

const STEP_XP = [60, 80, 70, 60, 90, 70, 100, 80, 90, 60, 80, 120, 80, 140] as const;

const CONCEPT_FEEDBACK: Record<string, ConceptFeedback> = {
	"weigh.non_canonical_container": {
		code: "weigh.non_canonical_container",
		title: "Gunakan kaca arloji untuk penimbangan",
		why: "Sampel terusi ditimbang pada kaca arloji agar massa yang diambil stabil, mudah dipindahkan, dan tidak langsung bercampur dengan wadah reaksi.",
		correction: "Ambil Kaca Arloji, pegang bersama Terusi, lalu timbang ulang sampai 0,45-0,55 g.",
		relatedConcept: "Teknik penimbangan analitik",
		blocking: true,
	},
	"weigh.too_much": {
		code: "weigh.too_much",
		title: "Massa sampel melewati rentang kerja",
		why: "Rentang kerja penetapan ini adalah sekitar 0,5 g. Sampel terlalu besar meningkatkan risiko endapan tidak tertangani sempurna dan massa residu keluar dari kondisi ideal.",
		correction: "Kosongkan wadah, lalu ulangi penimbangan sampai berada pada 0,45-0,55 g.",
		relatedConcept: "Akurasi dan presisi gravimetri",
		blocking: true,
	},
	"weigh.not_ready": {
		code: "weigh.not_ready",
		title: "Massa sampel belum memenuhi rentang kerja",
		why: "Sebelum dilarutkan, massa terusi harus sudah berada pada rentang kerja supaya perhitungan kadar Cu valid.",
		correction: "Kembali ke timbangan dan tambah sampel sampai 0,45-0,55 g.",
		relatedConcept: "Akurasi dan presisi gravimetri",
		blocking: true,
	},
	"dissolve.wrong_container": {
		code: "dissolve.wrong_container",
		title: "Pelarutan dilakukan di piala gelas",
		why: "Prosedur penetapan menggunakan piala gelas karena tahap berikutnya membutuhkan penambahan asam, pendidihan, pengendapan, dan pengadukan dalam volume larutan sekitar 100 mL.",
		correction: "Siapkan Piala Gelas berisi air suling, lalu larutkan sampel terusi di sana.",
		relatedConcept: "Pelarutan sampel gravimetri",
		blocking: true,
	},
	"dissolve.water_volume": {
		code: "dissolve.water_volume",
		title: "Volume air suling harus sekitar 100 mL",
		why: "Sampel terusi dilarutkan hingga sekitar 100 mL supaya Cu2+ terlarut merata dan siap diendapkan secara terkendali.",
		correction: "Tambahkan air suling sampai volume berada pada 90-120 mL, lalu lakukan pelarutan.",
		relatedConcept: "Pelarutan dan konsentrasi larutan induk",
		blocking: true,
	},
	"boil.no_acidify": {
		code: "boil.no_acidify",
		title: "Asamkan sebelum pendidihan",
		why: "Tanpa H2SO4 sebelum pendidihan, Cu2+ dapat terhidrolisis menjadi Cu(OH)2 koloid yang halus dan sulit disaring.",
		correction: "Tambahkan H2SO4 4N sampai larutan diasamkan, baru didihkan di teklu.",
		relatedConcept: "Urutan pengasaman-pendidihan-pengendapan",
		blocking: true,
	},
	"acidify.insufficient": {
		code: "acidify.insufficient",
		title: "H2SO4 belum cukup",
		why: "Pengasaman diperlukan untuk mencegah hidrolisis Cu2+ sebelum pendidihan. Larutan harus benar-benar diasamkan sebelum dipanaskan dengan teklu.",
		correction: "Tambahkan H2SO4 4N lagi sampai minimal 1 mL total, lalu lanjutkan pendidihan.",
		relatedConcept: "Pengasaman pra-pendidihan",
		blocking: true,
	},
	"precipitate.before_boil": {
		code: "precipitate.before_boil",
		title: "Didihkan larutan sebelum pengendapan",
		why: "Pengendapan dilakukan dalam kondisi panas agar Cu(OH)2 yang terbentuk terurai menjadi CuO yang lebih stabil, kasar, dan mudah disaring.",
		correction: "Asamkan larutan, didihkan di teklu, lalu tambahkan pengendap sedikit demi sedikit.",
		relatedConcept: "Pembentukan endapan gravimetri yang baik",
		blocking: true,
	},
	"precipitate.nh4oh_complex": {
		code: "precipitate.nh4oh_complex",
		title: "NH4OH tidak dipakai sebagai pengendap",
		why: "Amonia berlebih membentuk kompleks tetraamintembaga(II) yang larut, sehingga Cu2+ tidak mengendap sempurna.",
		correction: "Gunakan NaOH sebagai pereaksi pengendap, bukan NH4OH.",
		relatedConcept: "Kompleksasi vs pengendapan hidroksida",
		blocking: true,
	},
	"precipitate.koh_residue": {
		code: "precipitate.koh_residue",
		title: "Gunakan NaOH, bukan KOH",
		why: "KOH memang basa kuat, tetapi sisa kalium yang tidak tercuci dapat meninggalkan residu pijar dan membuat massa hasil terlalu besar.",
		correction: "Pilih NaOH sebagai pereaksi pengendap untuk penetapan ini.",
		relatedConcept: "Pemilihan pereaksi pengendap",
		blocking: true,
	},
	"precipitate.too_concentrated": {
		code: "precipitate.too_concentrated",
		title: "NaOH terlalu pekat",
		why: "NaOH yang terlalu pekat menimbulkan supersaturasi lokal sehingga endapan menjadi halus/koloid dan mudah lolos saat penyaringan.",
		correction: "Gunakan NaOH standar pada praktikum ini dan tambahkan perlahan.",
		relatedConcept: "Ukuran partikel endapan",
		blocking: true,
	},
	"precipitate.rapid_addition": {
		code: "precipitate.rapid_addition",
		title: "Tambahkan pengendap sedikit demi sedikit",
		why: "Penambahan sekaligus menghasilkan endapan halus. Endapan gravimetri yang baik harus kasar, berat, dan cepat mengendap.",
		correction: "Tuang NaOH dalam porsi kecil, kurang dari 5 mL per penambahan, sambil diaduk.",
		relatedConcept: "Teknik penambahan pengendap",
		blocking: true,
	},
	"filter.before_check": {
		code: "filter.before_check",
		title: "Uji pengendapan sempurna dulu",
		why: "Penyaringan hanya valid setelah seluruh Cu2+ dipastikan sudah mengendap. Jika belum, sebagian Cu tetap berada di filtrat dan kadar menjadi rendah.",
		correction: "Gunakan kertas lakmus atau uji tambahan pengendap sampai pengendapan dinyatakan sempurna, baru saring.",
		relatedConcept: "Uji pengendapan sempurna",
		blocking: true,
	},
	"dry.before_wash_test": {
		code: "dry.before_wash_test",
		title: "Cuci dan uji filtrat sebelum pengeringan",
		why: "Sulfat dan kelebihan basa tidak hilang saat pemijaran. Jika belum dicuci dan diuji, pengotor dapat menambah massa residu.",
		correction: "Cuci endapan dengan air suling, lakukan uji sulfat dan uji basa, lalu keringkan di oven.",
		relatedConcept: "Pencucian endapan gravimetri",
		blocking: true,
	},
	"furnace.before_dry": {
		code: "furnace.before_dry",
		title: "Siapkan krus sebelum pemijaran",
		why: "Endapan kering dari kaca arloji belum siap langsung dipijarkan. Residu perlu dipindahkan ke cawan porselen, diarangkan perlahan dengan teklu, lalu dipijarkan lebih kuat dengan meker.",
		correction: "Pindahkan kertas saring/endapan dari kaca arloji ke krus porselen, panaskan dulu dengan teklu, lalu lanjutkan di meker.",
		relatedConcept: "Pengabuan kertas saring dan pemijaran bertahap",
		blocking: true,
	},
};

type ContainerLike = InventoryItem | HeldItem;

export class GameRoom extends DurableObject {
	private players: Map<string, PlayerConnection> = new Map();
	private objects: Map<string, GameObjectState> = new Map();
	/**
	 * Per-player level state. Each student tracks their own milestone progress
	 * independently — one player completing step 5 does not advance others.
	 * Keyed by playerId. Lazily loaded from storage on first access.
	 */
	private levelStates: Map<string, LevelState> = new Map();
	private rateWindows: Map<string, RateWindow> = new Map();

	constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
		super(ctx, env);
		this.rehydratePlayers();
	}

	private createDefaultLevelState(): LevelState {
		const now = Date.now();
		return {
			levelId: LEVEL_ID,
			title: LEVEL_TITLE,
			xp: 0,
			finished: false,
			startedAt: now,
			updatedAt: now,
			milestones: LEVEL_MILESTONES.map((title, index) => ({
				step: index + 1,
				title,
				completed: false,
			})),
		};
	}

	private async loadState(): Promise<void> {
		if (this.objects.size > 0) return;
		let shouldPersist = false;

		const storedObjects = await this.ctx.storage.get<Record<string, GameObjectState>>("objects");

		if (storedObjects && Object.keys(storedObjects).length > 0) {
			for (const [id, obj] of Object.entries(storedObjects)) {
				this.objects.set(id, obj);
			}
		} else {
			this.initDefaults();
			shouldPersist = true;
		}

		if (!this.objects.has("oven-1")) {
			this.objects.set("oven-1", {
				id: "oven-1",
				objectType: "oven",
				items: [],
			});
			shouldPersist = true;
		}
		if (!this.objects.has("oven-2")) {
			this.objects.set("oven-2", {
				id: "oven-2",
				objectType: "oven",
				items: [],
			});
			shouldPersist = true;
		}
		if (!this.objects.has("furnace-1")) {
			this.objects.set("furnace-1", {
				id: "furnace-1",
				objectType: "furnace",
				items: [],
			});
			shouldPersist = true;
		}

		// Migration: add workbench-2..40 for rooms created before the 40-bench layout.
		for (let i = 2; i <= 40; i++) {
			const id = `workbench-${i}`;
			if (!this.objects.has(id)) {
				this.objects.set(id, { id, objectType: "workbench", items: [] });
				shouldPersist = true;
			}
		}

		// Ensure multiple timbangan exist (migration for rooms created before
		// concurrency support). Adds timbangan-2..6 if missing.
		for (let i = 2; i <= 6; i++) {
			const id = `timbangan-${i}`;
			if (!this.objects.has(id)) {
				this.objects.set(id, { id, objectType: "timbangan", items: [] });
				shouldPersist = true;
			}
		}

		if (this.splitWorkbenchStacks()) {
			shouldPersist = true;
		}

		if (this.normalizeToolDisplayNames()) {
			shouldPersist = true;
		}

		if (this.normalizeTestTubeCapacity()) {
			shouldPersist = true;
		}

		if (this.ensureStorageTools()) {
			shouldPersist = true;
		}

		// Migration: append reagent variants introduced in later versions to
		// existing rooms so persisted state doesn't lock students to an old
		// reagent set.
		if (this.ensureReagentVariants()) {
			shouldPersist = true;
		}

		if (shouldPersist || !storedObjects) {
			await this.persistObjects();
		}
	}

	/**
	 * Load (or initialize) a specific player's level state. Called on connect
	 * and whenever a handler needs to read/write progress for that player.
	 */
	private async ensurePlayerLevelState(playerId: string): Promise<LevelState> {
		const cached = this.levelStates.get(playerId);
		if (cached) return cached;

		const stored = await this.ctx.storage.get<LevelState>(`levelState:${playerId}`);
		if (stored && Array.isArray(stored.milestones) && stored.milestones.length === 14) {
			this.levelStates.set(playerId, stored);
			return stored;
		}

		const fresh = this.createDefaultLevelState();
		this.levelStates.set(playerId, fresh);
		await this.ctx.storage.put(`levelState:${playerId}`, fresh);
		return fresh;
	}

	private async persistObjects(): Promise<void> {
		const data: Record<string, GameObjectState> = {};
		for (const [id, obj] of this.objects) {
			data[id] = obj;
		}
		await this.ctx.storage.put("objects", data);
	}

	private async persistPlayerLevelState(playerId: string): Promise<void> {
		const state = this.levelStates.get(playerId);
		if (state) {
			await this.ctx.storage.put(`levelState:${playerId}`, state);
		}
	}

	/** Legacy callsites used to persist both objects + levelState together.
	 *  Kept as a thin alias for now — prefer persistObjects() or
	 *  persistPlayerLevelState() explicitly. */
	private async persistState(): Promise<void> {
		await this.persistObjects();
	}

	private initDefaults(): void {
		// 40 workbench tiles: 4 pairs × 2 cols × 5 rows — each tile is an
		// independent workbench so every student has their own bench slot.
		for (let i = 1; i <= 40; i++) {
			this.objects.set(`workbench-${i}`, {
				id: `workbench-${i}`,
				objectType: "workbench",
				items: [],
			});
		}

		// Multiple timbangan instances to support concurrent weighing by many
		// students (lab can host up to 10+ players simultaneously).
		for (let i = 1; i <= 6; i++) {
			this.objects.set(`timbangan-${i}`, {
				id: `timbangan-${i}`,
				objectType: "timbangan",
				items: [],
			});
		}

		this.objects.set("oven-1", {
			id: "oven-1",
			objectType: "oven",
			items: [],
		});

		this.objects.set("oven-2", {
			id: "oven-2",
			objectType: "oven",
			items: [],
		});

		this.objects.set("furnace-1", {
			id: "furnace-1",
			objectType: "furnace",
			items: [],
		});

		this.objects.set("storage-1", {
			id: "storage-1",
			objectType: "storage",
			items: [
				{ itemId: "piala-gelas", name: "Piala Gelas", category: "alat", quantity: 2, maxVolumeMl: 250, contents: [] },
				{ itemId: "pengaduk-kaca", name: "Pengaduk Kaca", category: "alat", quantity: 1 },
				{ itemId: "hot-plate", name: "Teklu", category: "alat", quantity: 1 },
				{ itemId: "meker", name: "Meker", category: "alat", quantity: 1 },
				{ itemId: "corong-stand", name: "Corong + Stand", category: "alat", quantity: 1 },
				{ itemId: "kertas-saring", name: "Kertas Saring Whatman", category: "alat", quantity: 3, maxVolumeMl: 20, contents: [] },
				{ itemId: "erlenmeyer", name: "Erlenmeyer", category: "alat", quantity: 1, maxVolumeMl: 250, contents: [] },
				{ itemId: "tabung-reaksi", name: "Tabung Reaksi", category: "alat", quantity: 2, maxVolumeMl: TEST_TUBE_MAX_VOLUME_ML, contents: [] },
				{ itemId: "kertas-lakmus", name: "Kertas Lakmus Merah", category: "alat", quantity: 5 },
				{ itemId: "krus-porselen", name: "Cawan Porselen", category: "alat", quantity: 1, maxVolumeMl: 30, contents: [] },
				{ itemId: "kaca-arloji", name: "Kaca Arloji", category: "alat", quantity: 3, maxVolumeMl: 50, contents: [] },
				{ itemId: "desikator", name: "Desikator", category: "alat", quantity: 1 },
			],
		});

		this.objects.set("reagent-table-1", {
			id: "reagent-table-1",
			objectType: "reagent_table",
			items: [
				{ itemId: "terusi", name: "Terusi (CuSO4·5H2O)", category: "bahan", quantity: 1, weightGrams: 10 },
				{ itemId: "air-suling", name: "Air Suling", category: "bahan", quantity: 1, volumeMl: 500 },
				{ itemId: "h2so4", name: "H2SO4 4N", category: "bahan", quantity: 1, volumeMl: 100 },
				{ itemId: "naoh", name: "NaOH 4N", category: "bahan", quantity: 1, volumeMl: 100 },
				{ itemId: "naoh-1n", name: "NaOH 1N (encer)", category: "bahan", quantity: 1, volumeMl: 100 },
				{ itemId: "naoh-8n", name: "NaOH 8N (pekat)", category: "bahan", quantity: 1, volumeMl: 100 },
				{ itemId: "koh-4n", name: "KOH 4N", category: "bahan", quantity: 1, volumeMl: 100 },
				{ itemId: "nh4oh-4n", name: "NH4OH 4N (amonia)", category: "bahan", quantity: 1, volumeMl: 100 },
				{ itemId: "bacl2", name: "BaCl2 0,5N", category: "bahan", quantity: 1, volumeMl: 50 },
				{ itemId: "hcl", name: "HCl 4N", category: "bahan", quantity: 1, volumeMl: 50 },
			],
		});
	}

	private ensureStorageTools(): boolean {
		const storage = this.objects.get("storage-1");
		if (!storage) return false;

		const required: InventoryItem[] = [
			{ itemId: "hot-plate", name: "Teklu", category: "alat", quantity: 1 },
			{ itemId: "meker", name: "Meker", category: "alat", quantity: 1 },
		];

		let changed = false;
		for (const item of required) {
			const existing = storage.items.find((i) => this.itemKind(i) === item.itemId);
			if (!existing) {
				storage.items.push(item);
				changed = true;
			} else if (existing.quantity < item.quantity) {
				existing.quantity = item.quantity;
				changed = true;
			}
		}
		return changed;
	}

	/**
	 * Idempotent migration: ensure every required reagent exists on the reagent
	 * table. Safe to call on every loadState — returns true if any item was
	 * added so the caller can persist state.
	 */
	private ensureReagentVariants(): boolean {
		const table = this.objects.get("reagent-table-1");
		if (!table) return false;

		const required: InventoryItem[] = [
			{ itemId: "naoh-1n", name: "NaOH 1N (encer)", category: "bahan", quantity: 1, volumeMl: 100 },
			{ itemId: "naoh-8n", name: "NaOH 8N (pekat)", category: "bahan", quantity: 1, volumeMl: 100 },
			{ itemId: "koh-4n", name: "KOH 4N", category: "bahan", quantity: 1, volumeMl: 100 },
			{ itemId: "nh4oh-4n", name: "NH4OH 4N (amonia)", category: "bahan", quantity: 1, volumeMl: 100 },
		];

		let changed = false;
		for (const item of required) {
			const exists = table.items.some((i) => this.itemKind(i) === item.itemId);
			if (!exists) {
				table.items.push(item);
				changed = true;
			}
		}
		return changed;
	}

	private normalizeToolDisplayNames(): boolean {
		let changed = false;
		for (const obj of this.objects.values()) {
			for (const item of obj.items) {
				if (this.itemKind(item) === "hot-plate" && item.name !== "Teklu") {
					item.name = "Teklu";
					changed = true;
				}
				if (this.itemKind(item) === "meker" && item.name !== "Meker") {
					item.name = "Meker";
					changed = true;
				}
				if (this.itemKind(item) === "krus-porselen" && item.name !== "Cawan Porselen") {
					item.name = "Cawan Porselen";
					changed = true;
				}
			}
		}
		return changed;
	}

	private normalizeTestTubeCapacity(): boolean {
		let changed = false;
		for (const obj of this.objects.values()) {
			for (const item of obj.items) {
				if (this.isItemKind(item, "tabung-reaksi") && (item.maxVolumeMl ?? 0) < TEST_TUBE_MAX_VOLUME_ML) {
					item.maxVolumeMl = TEST_TUBE_MAX_VOLUME_ML;
					changed = true;
				}
			}
		}
		return changed;
	}

	private sanitizePlayerName(raw?: string | null): string {
		if (!raw) return "Pemain";
		const cleaned = raw
			.replace(/[\u0000-\u001f\u007f]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 24);
		return cleaned || "Pemain";
	}

	private round4(value: number): number {
		return Math.round(value * 10000) / 10000;
	}

	private keyForRate(playerId: string, type: ClientMessage["type"]): string {
		return `${playerId}:${type}`;
	}

	private ensureLabMeta<T extends { labMeta?: LabContainerMeta }>(item: T): LabContainerMeta {
		if (!item.labMeta) item.labMeta = {};
		return item.labMeta;
	}

	/**
	 * Log a student decision into the container's labMeta.decisions map.
	 * Decisions are flat key/value; keys are free-form but should follow
	 * `<step>.<field>` convention (e.g. "weigh.sampleType", "naoh.normality").
	 */
	private logDecision<T extends { labMeta?: LabContainerMeta }>(
		item: T,
		key: string,
		value: DecisionValue,
	): void {
		const meta = this.ensureLabMeta(item);
		if (!meta.decisions) meta.decisions = {};
		meta.decisions[key] = value;
	}

	/**
	 * Append an issue code to outcomes (deduped). Issue codes are consumed by
	 * computeLevelReport and mapped to user-facing explanations in the UI.
	 */
	private logIssue<T extends { labMeta?: LabContainerMeta }>(item: T, code: string): void {
		const meta = this.ensureLabMeta(item);
		if (!meta.outcomes) meta.outcomes = {};
		if (!meta.outcomes.issues) meta.outcomes.issues = [];
		if (!meta.outcomes.issues.includes(code)) {
			meta.outcomes.issues.push(code);
		}
	}

	/**
	 * Remove an issue code (used when student corrects a prior mistake, e.g.
	 * re-washes after sulfate test positive).
	 */
	private clearIssue<T extends { labMeta?: LabContainerMeta }>(item: T, code: string): void {
		const issues = item.labMeta?.outcomes?.issues;
		if (!issues) return;
		const idx = issues.indexOf(code);
		if (idx >= 0) issues.splice(idx, 1);
	}

	/**
	 * Build the final report shown after milestone 14.
	 * Skeleton only — per-step handlers populate decisions/issues, and
	 * per-step logic in applyCalcination adjusts cuoMassG. Deviation analysis
	 * grows as more steps get wired in.
	 */
	private computeLevelReport(container: ContainerLike): LevelReport {
		const meta = container.labMeta ?? {};
		const sampleMassG = this.round4(meta.sampleTerusiG ?? 0);
		const cuoMassG = this.round4(meta.lastRecordedMassG ?? meta.cuoMassG ?? 0);
		const kadarRaw = sampleMassG > 0 ? (cuoMassG * GRAVIMETRIC_FACTOR_CU_CUO) / sampleMassG * 100 : 0;
		const kadarPercent = Math.round(kadarRaw * 100) / 100;
		const deviationPercent = Math.round((kadarPercent - THEORETICAL_CU_PERCENT) * 100) / 100;

		// Recompute per-issue impacts using the same rules as applyCalcination so
		// the report can attribute deviation to specific student decisions.
		const issueCodes = meta.outcomes?.issues ?? [];
		const idealCuo = this.round4(sampleMassG * CUO_FROM_TERUSI_RATIO);
		const { perIssueImpact } = this.applyIssueEffects(idealCuo, issueCodes);

		const decisions = meta.decisions ?? {};
		const issues: ReportIssue[] = issueCodes.map((code) => ({
			code,
			impactMassG: perIssueImpact[code] ?? 0,
			decisionSummary: this.summarizeDecisionForIssue(code, decisions),
		}));

		return {
			levelId: LEVEL_ID,
			sampleMassG,
			cuoMassG,
			gravimetricFactor: GRAVIMETRIC_FACTOR_CU_CUO,
			kadarPercent,
			theoreticalPercent: THEORETICAL_CU_PERCENT,
			deviationPercent,
			issues,
			decisions,
			generatedAt: Date.now(),
		};
	}

	/** Free-form contextual note per issue, composed from decisions so the
	 * report can show the student *what they did* that triggered the issue. */
	private summarizeDecisionForIssue(code: string, decisions: Record<string, DecisionValue>): string {
		switch (code) {
			case "weigh.out_of_range":
				return `Massa sampel ${decisions["weigh.sampleMassG"] ?? "?"} g`;
			case "weigh.non_canonical_container":
				return `Wadah: ${decisions["weigh.container"] ?? "bukan kaca arloji"}`;
			case "dissolve.insufficient_water":
				return `Volume air: ${decisions["dissolve.waterVolumeMl"] ?? "?"} mL`;
			case "acidify.insufficient":
				return `Volume H2SO4: ${decisions["acidify.h2so4VolumeMl"] ?? "?"} mL`;
			case "boil.no_acidify":
				return "Pendidihan tanpa pengasaman";
			case "precipitate.nh4oh_complex":
				return "Pereaksi pengendap: NH4OH";
			case "precipitate.koh_residue":
				return "Pereaksi pengendap: KOH";
			case "precipitate.too_concentrated":
				return `Normalitas: ${decisions["precipitate.normality"] ?? "8N"}`;
			case "precipitate.rapid_addition":
				return "Penambahan pereaksi tidak tetes demi tetes";
			default:
				return code;
		}
	}

	/**
	 * Send a level_report to the specific player whose container it is. Called
	 * when the final milestone (14: bobot tetap) completes for that player.
	 */
	private broadcastLevelReport(playerId: string, container: ContainerLike): void {
		const report = this.computeLevelReport(container);
		this.sendTo(playerId, { type: "level_report", report });
	}

	private ensureContents(item: ContainerLike): ContainerContent[] {
		if (!item.contents) item.contents = [];
		return item.contents;
	}

	private itemKind(item: { itemId: string; baseItemId?: string }): string {
		return item.baseItemId ?? this.contentItemKind(item.itemId);
	}

	private contentItemKind(itemId: string): string {
		const separator = itemId.indexOf("::");
		return separator === -1 ? itemId : itemId.slice(0, separator);
	}

	private isItemKind(item: { itemId: string; baseItemId?: string }, kind: string): boolean {
		return this.itemKind(item) === kind;
	}

	private makeWorkbenchInstanceId(baseItemId: string, obj: GameObjectState): string {
		let candidate = `${baseItemId}::${Math.random().toString(36).slice(2, 8)}`;
		while (obj.items.some((i) => i.itemId === candidate)) {
			candidate = `${baseItemId}::${Math.random().toString(36).slice(2, 8)}`;
		}
		return candidate;
	}

	private makeHeldInstanceId(baseItemId: string, holding: HeldItem[]): string {
		let candidate = `${baseItemId}::h${Math.random().toString(36).slice(2, 8)}`;
		while (holding.some((i) => i.itemId === candidate)) {
			candidate = `${baseItemId}::h${Math.random().toString(36).slice(2, 8)}`;
		}
		return candidate;
	}

	private splitWorkbenchStacks(): boolean {
		let changed = false;

		for (const obj of this.objects.values()) {
			if (obj.objectType !== "workbench") continue;

			let objectChanged = false;
			const nextItems: InventoryItem[] = [];

			for (const item of obj.items) {
				const quantity = Math.max(0, Math.floor(item.quantity ?? 0));
				if (quantity <= 0) {
					objectChanged = true;
					continue;
				}

				const baseItemId = this.itemKind(item);

				if (quantity === 1) {
					if (item.baseItemId !== baseItemId) {
						nextItems.push({ ...item, baseItemId });
						objectChanged = true;
					} else {
						nextItems.push(item);
					}
					continue;
				}

				objectChanged = true;

				for (let index = 0; index < quantity; index += 1) {
					const splitItem: InventoryItem = {
						itemId: this.makeWorkbenchInstanceId(baseItemId, {
							id: obj.id,
							objectType: "workbench",
							items: nextItems,
						}),
						baseItemId,
						name: item.name,
						category: item.category,
						quantity: 1,
					};

					if (item.maxVolumeMl !== undefined) splitItem.maxVolumeMl = item.maxVolumeMl;

					if (index === 0) {
						if (item.weightGrams !== undefined) splitItem.weightGrams = item.weightGrams;
						if (item.volumeMl !== undefined) splitItem.volumeMl = item.volumeMl;
						if (item.contents) splitItem.contents = this.cloneContents(item.contents);
						if (item.labMeta) splitItem.labMeta = { ...item.labMeta };
					} else if (!item.contents || item.contents.length === 0) {
						if (item.weightGrams !== undefined) splitItem.weightGrams = item.weightGrams;
						if (item.volumeMl !== undefined) splitItem.volumeMl = item.volumeMl;
					}

					nextItems.push(splitItem);
				}
			}

			if (objectChanged) {
				obj.items = nextItems;
				changed = true;
			}
		}

		return changed;
	}

	private isContainer(item: ContainerLike): boolean {
		return item.category === "alat" && item.maxVolumeMl !== undefined;
	}

	private getMaxVolume(item: ContainerLike): number {
		if (this.isItemKind(item, "tabung-reaksi")) {
			return Math.max(item.maxVolumeMl ?? 0, TEST_TUBE_MAX_VOLUME_ML);
		}
		return item.maxVolumeMl ?? 0;
	}

	private isSulfateTestReagentKind(kind: string): boolean {
		return kind === "hcl" || kind === "bacl2";
	}

	private isFiltrateTestTube(item: ContainerLike): boolean {
		if (!this.isItemKind(item, "tabung-reaksi")) return false;
		return Boolean(item.labMeta?.fromFiltrate) || this.getLiquidVolume(item, "filtrat-cucian") > 0;
	}

	private isFiltrateContainer(item: ContainerLike): boolean {
		return Boolean(item.labMeta?.fromFiltrate) || this.getLiquidVolume(item, "filtrat-cucian") > 0;
	}

	private hasTool(obj: GameObjectState, itemId: string): boolean {
		return obj.items.some((i) => this.isItemKind(i, itemId) && i.quantity > 0);
	}

	private getLiquidVolume(item: ContainerLike, itemId?: string): number {
		return (item.contents ?? [])
			.filter((c) => (c.volumeMl ?? 0) > 0 && (!itemId || this.contentItemKind(c.itemId) === itemId))
			.reduce((sum, c) => sum + (c.volumeMl ?? 0), 0);
	}

	private getSolidWeight(item: ContainerLike, itemId?: string): number {
		return (item.contents ?? [])
			.filter((c) => (c.weightGrams ?? 0) > 0 && (!itemId || this.contentItemKind(c.itemId) === itemId))
			.reduce((sum, c) => sum + (c.weightGrams ?? 0), 0);
	}

	private hasSolid(item: ContainerLike, itemId?: string): boolean {
		return this.getSolidWeight(item, itemId) > 0;
	}

	private hasDissolvedTerusi(item: ContainerLike): boolean {
		return (item.contents ?? []).some(
			(c) => this.contentItemKind(c.itemId) === "terusi" && (c.weightGrams ?? 0) > 0 && c.dissolved,
		);
	}

	private markTerusiDissolvedIfReady(item: ContainerLike): boolean {
		const waterVolume = this.getLiquidVolume(item, "air-suling");
		if (waterVolume <= 0) return false;

		let changed = false;
		for (const content of item.contents ?? []) {
			if (
				this.contentItemKind(content.itemId) === "terusi" &&
				(content.weightGrams ?? 0) > 0 &&
				!content.dissolved
			) {
				content.dissolved = true;
				changed = true;
			}
		}
		return changed;
	}

	private async completeDissolutionIfReady(playerId: string, container: ContainerLike): Promise<void> {
		if (!this.isItemKind(container, "piala-gelas")) return;
		this.markTerusiDissolvedIfReady(container);

		const dissolvedTerusi = this.getSolidWeight(container, "terusi");
		const waterVolume = this.getLiquidVolume(container, "air-suling");
		if (dissolvedTerusi <= 0 || waterVolume <= 0) return;

		this.logDecision(container, "dissolve.waterVolumeMl", waterVolume);
		this.logDecision(container, "dissolve.container", this.itemKind(container));

		if (waterVolume < 90 || waterVolume > 120) {
			this.sendConceptFeedback(playerId, "dissolve.water_volume");
			return;
		}

		this.clearIssue(container, "dissolve.insufficient_water");
		await this.completeMilestone(playerId, 2, `Terusi dilarutkan dalam ${waterVolume}mL air suling`);
	}

	private upsertLiquid(item: ContainerLike, itemId: string, name: string, volumeMl: number): void {
		const contents = this.ensureContents(item);
		const normalizedItemId = this.contentItemKind(itemId);
		const found = contents.find((c) => this.contentItemKind(c.itemId) === normalizedItemId);
		if (found) {
			found.volumeMl = this.round4((found.volumeMl ?? 0) + volumeMl);
			return;
		}
		contents.push({ itemId: normalizedItemId, name, volumeMl });
	}

	private upsertSolid(item: ContainerLike, itemId: string, name: string, weightGrams: number, dissolved?: boolean): void {
		const contents = this.ensureContents(item);
		const normalizedItemId = this.contentItemKind(itemId);
		const found = contents.find((c) => this.contentItemKind(c.itemId) === normalizedItemId);
		if (found) {
			found.weightGrams = this.round4((found.weightGrams ?? 0) + weightGrams);
			if (dissolved !== undefined) found.dissolved = dissolved;
			return;
		}
		contents.push({ itemId: normalizedItemId, name, weightGrams, dissolved });
	}

	private cloneContents(contents?: ContainerContent[]): ContainerContent[] {
		return (contents ?? []).map((c) => ({ ...c }));
	}

	private getContentsVolume(contents?: ContainerContent[]): number {
		return (contents ?? []).reduce((sum, c) => sum + (c.volumeMl ?? 0), 0);
	}

	private transferFiltrateAliquot(sourceContents: ContainerContent[] | undefined, target: ContainerLike, maxTransferMl = 5): boolean {
		const liquids = (sourceContents ?? []).filter((c) => (c.volumeMl ?? 0) > 0);
		const totalVolume = this.getContentsVolume(liquids);
		if (totalVolume <= 0) return false;

		const transfer = this.round4(Math.min(maxTransferMl, totalVolume));
		for (const liquid of liquids) {
			const current = liquid.volumeMl ?? 0;
			const portion = Math.min(current, this.round4((current / totalVolume) * transfer));
			liquid.volumeMl = this.round4(current - portion);
			if ((liquid.volumeMl ?? 0) <= 0.0001) liquid.volumeMl = 0;
		}

		this.upsertLiquid(target, "filtrat-cucian", "Filtrat Cucian", transfer);
		this.ensureLabMeta(target).fromFiltrate = true;
		return true;
	}

	private async completeSulfateTestIfReady(playerId: string, target: ContainerLike): Promise<void> {
		const targetMeta = this.ensureLabMeta(target);
		if (targetMeta.fromFiltrate && targetMeta.sulfateTestHclAdded && targetMeta.sulfateTestBaCl2Added) {
			await this.completeMilestone(playerId, 9, "Uji sulfat selesai: filtrat cucian diasamkan HCl lalu diuji BaCl2");
		}
	}

	private async applySulfateTestReagent(
		playerId: string,
		source: ContainerLike,
		target: ContainerLike,
		requestedMl = SULFATE_TEST_REAGENT_ML,
	): Promise<boolean> {
		const sourceKind = this.itemKind(source);
		if (!this.isSulfateTestReagentKind(sourceKind) || !this.isFiltrateTestTube(target)) return false;
		if ((source.volumeMl ?? 0) <= 0) return false;

		const remainingCapacity = Math.max(0, this.getMaxVolume(target) - this.getContentsVolume(target.contents));
		const transferMl = this.round4(Math.min(SULFATE_TEST_REAGENT_ML, requestedMl, source.volumeMl ?? 0, remainingCapacity));
		if (transferMl <= 0) return false;

		source.volumeMl = this.round4((source.volumeMl ?? 0) - transferMl);
		if (source.volumeMl <= 0.0001) source.volumeMl = 0;
		this.upsertLiquid(target, source.itemId, source.name, transferMl);

		const targetMeta = this.ensureLabMeta(target);
		targetMeta.fromFiltrate = true;
		if (sourceKind === "hcl") targetMeta.sulfateTestHclAdded = true;
		if (sourceKind === "bacl2") targetMeta.sulfateTestBaCl2Added = true;
		await this.completeSulfateTestIfReady(playerId, target);
		return true;
	}

	private mergeContents(target: ContainerContent[], additions: ContainerContent[]): void {
		for (const addition of additions) {
			const normalizedItemId = this.contentItemKind(addition.itemId);
			const existing = target.find(
				(c) => this.contentItemKind(c.itemId) === normalizedItemId && Boolean(c.dissolved) === Boolean(addition.dissolved),
			);
			if (existing) {
				if (addition.weightGrams !== undefined) {
					existing.weightGrams = this.round4((existing.weightGrams ?? 0) + addition.weightGrams);
				}
				if (addition.volumeMl !== undefined) {
					existing.volumeMl = this.round4((existing.volumeMl ?? 0) + addition.volumeMl);
				}
				if (addition.dissolved !== undefined) {
					existing.dissolved = addition.dissolved;
				}
				continue;
			}

			target.push({ ...addition, itemId: normalizedItemId });
		}
	}

	private addItemBackToObject(obj: GameObjectState, detached: InventoryItem): void {
		const detachedKind = this.itemKind(detached);

		if (obj.objectType === "workbench") {
			obj.items.push({
				...detached,
				itemId: this.makeWorkbenchInstanceId(detachedKind, obj),
				baseItemId: detachedKind,
				quantity: 1,
				contents: this.cloneContents(detached.contents),
				labMeta: detached.labMeta ? { ...detached.labMeta } : undefined,
			});
			return;
		}

		const existing = obj.items.find((i) => this.itemKind(i) === detachedKind && i.quantity > 0);
		if (!existing) {
			obj.items.push({
				...detached,
				itemId: detachedKind,
				baseItemId: undefined,
				contents: this.cloneContents(detached.contents),
				labMeta: detached.labMeta ? { ...detached.labMeta } : undefined,
			});
			return;
		}

		const wasEmpty = existing.quantity <= 0;
		existing.quantity += detached.quantity;

		if (wasEmpty) {
			existing.weightGrams = detached.weightGrams;
			existing.volumeMl = detached.volumeMl;
			if (detached.maxVolumeMl !== undefined) existing.maxVolumeMl = detached.maxVolumeMl;
			existing.labMeta = detached.labMeta ? { ...detached.labMeta } : undefined;
		}

		if (detached.contents && detached.contents.length > 0) {
			if (!existing.contents) existing.contents = [];
			this.mergeContents(existing.contents, this.cloneContents(detached.contents));
		}

		if (!wasEmpty && detached.labMeta) {
			existing.labMeta = { ...existing.labMeta, ...detached.labMeta };
		}
	}

	private attachFilterPaperToSetup(setupItem: InventoryItem, filterItem: InventoryItem): boolean {
		const setupMeta = this.ensureLabMeta(setupItem);
		if (setupMeta.setupFilterPaperAttached) return false;
		if (filterItem.quantity <= 0) return false;

		filterItem.quantity -= 1;
		setupMeta.setupFilterPaperAttached = true;
		if (!setupItem.contents) setupItem.contents = [];
		return true;
	}

	private attachReceiverToSetup(setupItem: InventoryItem, receiverItem: InventoryItem): boolean {
		if (!this.isItemKind(receiverItem, "piala-gelas")) return false;
		if (receiverItem.quantity <= 0) return false;

		const hasExistingMaterial = (receiverItem.contents ?? []).some(
			(c) => (c.volumeMl ?? 0) > 0 || (c.weightGrams ?? 0) > 0,
		);
		if (hasExistingMaterial) return false;
		if (receiverItem.labMeta?.precipitated) return false;

		const setupMeta = this.ensureLabMeta(setupItem);
		if (setupMeta.setupReceiverAttached) return false;

		receiverItem.quantity -= 1;
		setupMeta.setupReceiverAttached = true;
		setupMeta.setupReceiverItemId = this.itemKind(receiverItem);
		setupMeta.setupReceiverName = receiverItem.name;
		setupMeta.setupReceiverMaxVolumeMl = receiverItem.maxVolumeMl ?? 250;
		setupMeta.setupReceiverContents = this.cloneContents(receiverItem.contents);
		setupMeta.setupReceiverFromFiltrate = Boolean(receiverItem.labMeta?.fromFiltrate);

		receiverItem.contents = [];
		receiverItem.labMeta = undefined;
		return true;
	}

	private async runFiltrationIntoSetup(playerId: string, sourceItem: InventoryItem, setupItem: InventoryItem): Promise<boolean> {
		const setupMeta = this.ensureLabMeta(setupItem);
		if (!setupMeta.setupFilterPaperAttached || !setupMeta.setupReceiverAttached) {
			return false;
		}

		const sourceMeta = this.ensureLabMeta(sourceItem);
		if (!sourceMeta.precipitated) {
			return false;
		}
		if (!sourceMeta.precipitationChecked) {
			this.sendConceptFeedback(playerId, "filter.before_check");
			return true;
		}

		const liquids = this.cloneContents((sourceItem.contents ?? []).filter((c) => (c.volumeMl ?? 0) > 0));
		const solids = this.cloneContents((sourceItem.contents ?? []).filter((c) => (c.weightGrams ?? 0) > 0));
		if (liquids.length === 0 || solids.length === 0) {
			return false;
		}

		const maxReceiverVolume = setupMeta.setupReceiverMaxVolumeMl ?? 0;
		if (maxReceiverVolume <= 0) {
			return false;
		}

		const incomingVolume = this.getContentsVolume(liquids);
		const currentReceiverVolume = this.getContentsVolume(setupMeta.setupReceiverContents);
		if (incomingVolume > maxReceiverVolume - currentReceiverVolume + 0.0001) {
			return false;
		}

		if (!setupMeta.setupReceiverContents) setupMeta.setupReceiverContents = [];
		this.mergeContents(setupMeta.setupReceiverContents, liquids);
		setupMeta.setupReceiverFromFiltrate = true;

		setupItem.contents = solids;
		setupMeta.sampleTerusiG = sourceMeta.sampleTerusiG;
		setupMeta.decisions = sourceMeta.decisions ? { ...sourceMeta.decisions } : setupMeta.decisions;
		setupMeta.outcomes = sourceMeta.outcomes
			? {
				...sourceMeta.outcomes,
				issues: sourceMeta.outcomes.issues ? [...sourceMeta.outcomes.issues] : undefined,
			}
			: setupMeta.outcomes;
		setupMeta.precipitated = true;
		setupMeta.stirred = sourceMeta.stirred;
		setupMeta.precipitationChecked = sourceMeta.precipitationChecked;
		setupMeta.filtered = true;
		sourceItem.contents = [];
		sourceMeta.filtered = true;

		await this.completeMilestone(playerId, 7, "Penyaringan via setup corong + kertas saring + piala penampung berhasil");
		return true;
	}

	private detachSetupFilter(obj: GameObjectState, setupItem: InventoryItem): boolean {
		const setupMeta = this.ensureLabMeta(setupItem);
		if (!setupMeta.setupFilterPaperAttached) return false;

		const detachedFilter: InventoryItem = {
			itemId: "kertas-saring",
			name: "Kertas Saring Whatman",
			category: "alat",
			quantity: 1,
			maxVolumeMl: 20,
			contents: this.cloneContents(setupItem.contents),
			labMeta: {
				precipitated: true,
				filtered: true,
				washed: setupMeta.washed,
				baseTested: setupMeta.baseTested,
				sampleTerusiG: setupMeta.sampleTerusiG,
				decisions: setupMeta.decisions ? { ...setupMeta.decisions } : undefined,
				outcomes: setupMeta.outcomes
					? {
						...setupMeta.outcomes,
						issues: setupMeta.outcomes.issues ? [...setupMeta.outcomes.issues] : undefined,
					}
					: undefined,
			},
		};

		this.addItemBackToObject(obj, detachedFilter);
		setupItem.contents = [];
		setupMeta.setupFilterPaperAttached = false;
		setupMeta.precipitated = undefined;
		setupMeta.filtered = undefined;
		setupMeta.washed = undefined;
		setupMeta.baseTested = undefined;
		setupMeta.sampleTerusiG = undefined;
		return true;
	}

	private detachSetupReceiver(obj: GameObjectState, setupItem: InventoryItem): boolean {
		const setupMeta = this.ensureLabMeta(setupItem);
		if (!setupMeta.setupReceiverAttached) return false;
		if (!setupMeta.setupReceiverItemId || !setupMeta.setupReceiverName) return false;

		const detachedReceiver: InventoryItem = {
			itemId: setupMeta.setupReceiverItemId,
			name: setupMeta.setupReceiverName,
			category: "alat",
			quantity: 1,
			maxVolumeMl: setupMeta.setupReceiverMaxVolumeMl,
			contents: this.cloneContents(setupMeta.setupReceiverContents),
			labMeta: setupMeta.setupReceiverFromFiltrate ? { fromFiltrate: true } : undefined,
		};

		this.addItemBackToObject(obj, detachedReceiver);
		setupMeta.setupReceiverAttached = false;
		setupMeta.setupReceiverItemId = undefined;
		setupMeta.setupReceiverName = undefined;
		setupMeta.setupReceiverMaxVolumeMl = undefined;
		setupMeta.setupReceiverContents = undefined;
		setupMeta.setupReceiverFromFiltrate = undefined;
		return true;
	}

	private detachSetupPart(
		obj: GameObjectState,
		setupItem: InventoryItem,
		part: "filter" | "receiver" | "all",
	): boolean {
		if (part === "filter") {
			return this.detachSetupFilter(obj, setupItem);
		}
		if (part === "receiver") {
			return this.detachSetupReceiver(obj, setupItem);
		}

		const detachedReceiver = this.detachSetupReceiver(obj, setupItem);
		const detachedFilter = this.detachSetupFilter(obj, setupItem);
		return detachedReceiver || detachedFilter;
	}

	private moveFilterResidueToWatchGlass(filterItem: InventoryItem, watchGlass: InventoryItem): boolean {
		if (!this.isItemKind(filterItem, "kertas-saring")) return false;
		if (!this.isItemKind(watchGlass, "kaca-arloji")) return false;
		if (!this.hasSolid(filterItem)) return false;

		if (!watchGlass.contents) watchGlass.contents = [];
		this.mergeContents(watchGlass.contents, this.cloneContents(filterItem.contents));

		const filterMeta = this.ensureLabMeta(filterItem);
		const watchMeta = this.ensureLabMeta(watchGlass);
		watchMeta.precipitated = true;
		watchMeta.filtered = true;
		watchMeta.washed = filterMeta.washed;
		watchMeta.baseTested = filterMeta.baseTested;
		watchMeta.sampleTerusiG = filterMeta.sampleTerusiG;
		watchMeta.decisions = filterMeta.decisions ? { ...filterMeta.decisions } : watchMeta.decisions;
		watchMeta.outcomes = filterMeta.outcomes
			? {
				...filterMeta.outcomes,
				issues: filterMeta.outcomes.issues ? [...filterMeta.outcomes.issues] : undefined,
			}
			: watchMeta.outcomes;

		filterItem.contents = [];
		filterItem.labMeta = undefined;
		filterItem.quantity = 0;
		return true;
	}

	private moveDriedResidueToCrucible(sourceItem: InventoryItem, crucible: InventoryItem): boolean {
		if (!this.isItemKind(crucible, "krus-porselen")) return false;
		if (!this.isItemKind(sourceItem, "kaca-arloji") && !this.isItemKind(sourceItem, "kertas-saring")) return false;
		if (!this.hasSolid(sourceItem, "endapan-cuoh2") && !this.hasSolid(sourceItem, "cuo-hasil-pijar")) return false;

		const sourceMeta = this.ensureLabMeta(sourceItem);
		if (!sourceMeta.dried) return false;

		if (!crucible.contents) crucible.contents = [];
		this.mergeContents(crucible.contents, this.cloneContents(sourceItem.contents));

		const crucibleMeta = this.ensureLabMeta(crucible);
		crucibleMeta.precipitated = true;
		crucibleMeta.filtered = true;
		crucibleMeta.washed = sourceMeta.washed;
		crucibleMeta.baseTested = sourceMeta.baseTested;
		crucibleMeta.dried = true;
		crucibleMeta.transferredToCrucible = true;
		crucibleMeta.sampleTerusiG = sourceMeta.sampleTerusiG;
		crucibleMeta.decisions = sourceMeta.decisions ? { ...sourceMeta.decisions } : crucibleMeta.decisions;
		crucibleMeta.outcomes = sourceMeta.outcomes
			? {
				...sourceMeta.outcomes,
				issues: sourceMeta.outcomes.issues ? [...sourceMeta.outcomes.issues] : undefined,
			}
			: crucibleMeta.outcomes;

		sourceItem.contents = [];
		sourceItem.labMeta = undefined;
		return true;
	}

	private clearContainerContents(item: ContainerLike): void {
		const isSetup = this.isItemKind(item, "corong-stand");
		if (!this.isContainer(item) && !isSetup) return;
		item.contents = [];

		if (isSetup && item.labMeta) {
			const setupFilterPaperAttached = Boolean(item.labMeta.setupFilterPaperAttached);
			const setupReceiverAttached = Boolean(item.labMeta.setupReceiverAttached);
			if (setupFilterPaperAttached || setupReceiverAttached) {
				item.labMeta = {
					setupFilterPaperAttached,
					setupReceiverAttached,
					setupReceiverItemId: item.labMeta.setupReceiverItemId,
					setupReceiverName: item.labMeta.setupReceiverName,
					setupReceiverMaxVolumeMl: item.labMeta.setupReceiverMaxVolumeMl,
					setupReceiverContents: [],
					setupReceiverFromFiltrate: false,
				};
				return;
			}
		}

		item.labMeta = undefined;
	}

	private isMilestoneDone(playerId: string, step: number): boolean {
		const state = this.levelStates.get(playerId);
		if (!state) return false;
		const milestone = state.milestones[step - 1];
		return Boolean(milestone?.completed);
	}

	private async completeMilestone(playerId: string, step: number, detail: string): Promise<boolean> {
		const state = await this.ensurePlayerLevelState(playerId);
		const idx = step - 1;
		if (idx < 0 || idx >= state.milestones.length) return false;
		const milestone = state.milestones[idx];
		if (milestone.completed) return false;
		if (idx > 0 && !state.milestones[idx - 1].completed) {
			return false;
		}

		const now = Date.now();
		milestone.completed = true;
		milestone.completedAt = now;
		milestone.detail = detail;
		state.xp += STEP_XP[idx];
		state.updatedAt = now;
		state.lastEvent = `Milestone ${step} tercapai: ${milestone.title}`;
		state.finished = state.milestones.every((m) => m.completed);

		await this.persistPlayerLevelState(playerId);
		this.sendTo(playerId, { type: "level_state", level: state });
		return true;
	}

	private sendSnapshot(playerId: string): void {
		const player = this.players.get(playerId);
		if (!player) return;
		const snapshot: ServerMessage = {
			type: "snapshot",
			selfId: playerId,
			players: Array.from(this.players.values()).map((p) => p.state),
			objects: Array.from(this.objects.values()),
		};
		this.sendTo(playerId, snapshot);
	}

	private async resetFinishedLevel(playerId: string, player: PlayerConnection): Promise<void> {
		const state = await this.ensurePlayerLevelState(playerId);
		if (!state.finished) {
			this.sendError(player.ws, "Reset hanya tersedia setelah semua step selesai");
			return;
		}

		this.objects.clear();
		this.initDefaults();
		await this.persistObjects();

		const freshLevel = this.createDefaultLevelState();
		freshLevel.lastEvent = "Praktikum direset. Mulai lagi dari penimbangan sampel.";
		this.levelStates.set(playerId, freshLevel);
		await this.persistPlayerLevelState(playerId);

		player.state.holding = [];
		this.persistPlayerState(player.ws, player.state);
		this.sendSnapshot(playerId);
		this.sendTo(playerId, { type: "level_state", level: freshLevel });
		this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
	}

	/** Send a single server message to one player's websocket. Used for per-user
	 *  events like level_state and level_report that should not leak to other
	 *  players. Silently no-ops if the player is not connected. */
	private sendTo(playerId: string, msg: ServerMessage): void {
		const player = this.players.get(playerId);
		if (!player) return;
		try {
			player.ws.send(JSON.stringify(msg));
		} catch {
			// player may have disconnected; ignore
		}
	}

	private sendConceptFeedback(playerId: string, code: string): void {
		const feedback = CONCEPT_FEEDBACK[code];
		if (!feedback) return;
		this.sendTo(playerId, { type: "concept_feedback", feedback });
	}

	private blockWithConcept(playerId: string, code: string): false {
		this.sendConceptFeedback(playerId, code);
		return false;
	}

	private checkRateLimit(playerId: string, type: ClientMessage["type"]): boolean {
		const now = Date.now();
		const key = this.keyForRate(playerId, type);
		const existing = this.rateWindows.get(key);

		const config: Record<ClientMessage["type"], { max: number; windowMs: number }> = {
			move: { max: 25, windowMs: 1000 },
			stop: { max: 25, windowMs: 1000 },
			chat: { max: 4, windowMs: 5000 },
			take_item: { max: 10, windowMs: 3000 },
			place_item: { max: 10, windowMs: 3000 },
			use_held_on_item: { max: 12, windowMs: 3000 },
			weigh_item: { max: 10, windowMs: 3000 },
			scoop_sample: { max: 40, windowMs: 3000 },
			pour_item: { max: 10, windowMs: 3000 },
			dissolve_item: { max: 10, windowMs: 3000 },
			combine_items: { max: 10, windowMs: 3000 },
			record_mass: { max: 10, windowMs: 3000 },
			discard_object_contents: { max: 12, windowMs: 3000 },
			discard_held_contents: { max: 12, windowMs: 3000 },
			detach_setup_part: { max: 12, windowMs: 3000 },
			reset_level: { max: 2, windowMs: 5000 },
		};

		const { max, windowMs } = config[type];
		if (!existing || now - existing.windowStart >= windowMs) {
			this.rateWindows.set(key, { count: 1, windowStart: now });
			return true;
		}

		existing.count += 1;
		this.rateWindows.set(key, existing);
		return existing.count <= max;
	}

	async fetch(request: Request): Promise<Response> {
		await this.loadState();
		const url = new URL(request.url);

		if (url.pathname !== "/ws") {
			return new Response("Not found", { status: 404 });
		}

		const upgradeHeader = request.headers.get("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return new Response("Expected WebSocket upgrade", { status: 426 });
		}

		const randomSuffix = Math.random().toString(36).slice(2, 6);
		const sessionIdRaw = url.searchParams.get("sid")?.trim().toLowerCase();
		const sessionId = sessionIdRaw && PLAYER_ID_REGEX.test(sessionIdRaw)
			? sessionIdRaw
			: `guest-${randomSuffix}`;
		const nameFromQuery = this.sanitizePlayerName(url.searchParams.get("name"));
		const user = {
			id: sessionId,
			name: nameFromQuery || `Pemain ${randomSuffix}`,
		};

		if (this.players.size >= ROOM_CONFIG.MAX_PLAYERS) {
			return new Response("Ruangan penuh", { status: 503 });
		}

		const pair = new WebSocketPair();
		const [client, server] = [pair[0], pair[1]];
		this.ctx.acceptWebSocket(server);

		const ts = ROOM_CONFIG.TILE_SIZE;
		// Spawn at bottom corridor of main lab: col 13, row 18.
		const spawnCenterX = 13 * ts + ts / 2;
		const spawnCenterY = 18 * ts + ts / 2;
		const spawnOffsetX = (Math.random() - 0.5) * ts * 0.5;
		const spawnOffsetY = (Math.random() - 0.5) * ts * 0.5;
		const playerState: PlayerState = {
			id: user.id,
			name: user.name,
			x: spawnCenterX + spawnOffsetX,
			y: spawnCenterY + spawnOffsetY,
			direction: "down" as Direction,
			vx: 0,
			vy: 0,
			holding: [],
		};

		this.players.set(user.id, { ws: server, state: playerState });
		this.persistPlayerState(server, playerState);

		const snapshot: ServerMessage = {
			type: "snapshot",
			selfId: user.id,
			players: Array.from(this.players.values()).map((p) => p.state),
			objects: Array.from(this.objects.values()),
		};
		server.send(JSON.stringify(snapshot));

		const playerLevelState = await this.ensurePlayerLevelState(user.id);
		server.send(JSON.stringify({ type: "level_state", level: playerLevelState } satisfies ServerMessage));

		this.broadcast({ type: "player_join", player: playerState }, user.id);
		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		await this.loadState();
		const attachment = ws.deserializeAttachment() as { playerState: PlayerState } | null;
		if (!attachment) return;
		const player = this.players.get(attachment.playerState.id);
		if (!player) return;

		try {
			const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
			const payload = JSON.parse(raw) as Record<string, unknown>;
			const normalized =
				payload?.type === "pour_item"
					? {
						...payload,
						transferMl: Number(payload.transferMl),
					}
					: payload?.type === "record_mass"
						? {
							...payload,
							measuredMassG: Number(payload.measuredMassG),
						}
						: payload;
			const parsed = clientMessageSchema.parse(normalized);

			if (!this.checkRateLimit(attachment.playerState.id, parsed.type)) {
				this.sendError(ws, "Terlalu banyak aksi, coba lagi sebentar");
				return;
			}

			await this.handleClientMessage(attachment.playerState.id, player, parsed);
		} catch (error) {
			let message = "Pesan tidak valid";
			if (error instanceof Error) {
				message = `Pesan tidak valid: ${error.message.slice(0, 120)}`;
			}
			ws.send(JSON.stringify({ type: "error", message } satisfies ServerMessage));
		}
	}

	async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
		const attachment = ws.deserializeAttachment() as { playerState: PlayerState } | null;
		if (!attachment) return;
		this.players.delete(attachment.playerState.id);
		this.broadcast({ type: "player_leave", playerId: attachment.playerState.id });
	}

	async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
		const attachment = ws.deserializeAttachment() as { playerState: PlayerState } | null;
		if (!attachment) return;
		this.players.delete(attachment.playerState.id);
		this.broadcast({ type: "player_leave", playerId: attachment.playerState.id });
	}

	/**
	 * Shared weighing logic used by both weigh_item (typed transfer) and
	 * scoop_sample (random jitter). Returns true if the transfer happened.
	 */
	private async applyWeighTransfer(playerId: string, player: PlayerConnection, transferGrams: number): Promise<boolean> {
		const bahanIdx = player.state.holding.findIndex(
			(h) => h.category === "bahan" && h.weightGrams && h.weightGrams > 0,
		);
		const containerIdx = player.state.holding.findIndex(
			(h) => h.category === "alat" && h.maxVolumeMl !== undefined,
		);

		if (bahanIdx === -1) {
			this.sendError(player.ws, "Kamu harus memegang bahan padat");
			return false;
		}
		if (containerIdx === -1) {
			this.sendError(player.ws, "Kamu harus memegang wadah");
			return false;
		}

		const bahan = player.state.holding[bahanIdx];
		const container = player.state.holding[containerIdx];

		if (transferGrams > (bahan.weightGrams ?? 0)) {
			this.sendError(player.ws, "Berat transfer melebihi berat bahan");
			return false;
		}

		if (this.isItemKind(bahan, "terusi")) {
			const containerKind = this.itemKind(container);
			if (containerKind !== "kaca-arloji") {
				return this.blockWithConcept(playerId, "weigh.non_canonical_container");
			}

			const currentSample = container.labMeta?.sampleTerusiG ?? this.getSolidWeight(container, "terusi");
			const nextSample = this.round4(currentSample + transferGrams);
			if (nextSample > 0.55) {
				return this.blockWithConcept(playerId, "weigh.too_much");
			}
		}

		bahan.weightGrams = this.round4((bahan.weightGrams ?? 0) - transferGrams);
		if (!container.contents) container.contents = [];
		const bahanKind = this.itemKind(bahan);
		const existingContent = container.contents.find((c) => this.contentItemKind(c.itemId) === bahanKind);
		if (existingContent && existingContent.weightGrams !== undefined) {
			existingContent.weightGrams = this.round4(existingContent.weightGrams + transferGrams);
		} else {
			container.contents.push({ itemId: bahanKind, name: bahan.name, weightGrams: transferGrams });
		}

		if (this.isItemKind(bahan, "terusi")) {
			const meta = this.ensureLabMeta(container);
			meta.sampleTerusiG = this.round4((meta.sampleTerusiG ?? 0) + transferGrams);
			const sample = meta.sampleTerusiG ?? 0;
			const containerKind = this.itemKind(container);

			this.logDecision(container, "weigh.sampleMassG", sample);
			this.logDecision(container, "weigh.sampleType", "industri");
			this.logDecision(container, "weigh.container", containerKind);

			const inRange = sample >= 0.45 && sample <= 0.55;
			if (inRange) this.clearIssue(container, "weigh.out_of_range");
			this.clearIssue(container, "weigh.non_canonical_container");

			const detailParts = [`Sampel terusi ditimbang ${sample}g`];
			if (inRange) {
				await this.completeMilestone(playerId, 1, detailParts.join(" · "));
			}
		}

		if (bahan.weightGrams <= 0) {
			player.state.holding.splice(bahanIdx, 1);
		}

		this.persistPlayerState(player.ws, player.state);
		this.broadcast({ type: "player_hold", playerId: player.state.id, holding: player.state.holding });
		return true;
	}

	private async handleClientMessage(playerId: string, player: PlayerConnection, msg: ClientMessage): Promise<void> {
		switch (msg.type) {
			case "reset_level": {
				await this.resetFinishedLevel(playerId, player);
				break;
			}
			case "chat": {
				const text = msg.text.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
				if (!text) {
					this.sendError(player.ws, "Pesan chat kosong");
					break;
				}
				this.broadcast({ type: "chat", playerId, playerName: player.state.name, text });
				break;
			}
			case "move": {
				const distance = Math.hypot(msg.x - player.state.x, msg.y - player.state.y);
				if (distance > MOVE_MAX_DISTANCE_PER_MSG) {
					this.sendError(player.ws, "Pergerakan tidak valid");
					break;
				}
				const x = Math.max(0, Math.min(msg.x, ROOM_CONFIG.MAP_WIDTH));
				const y = Math.max(0, Math.min(msg.y, ROOM_CONFIG.MAP_HEIGHT));
				player.state.x = x;
				player.state.y = y;
				player.state.direction = msg.direction;
				player.state.vx = msg.vx;
				player.state.vy = msg.vy;
				this.persistPlayerState(player.ws, player.state);
				this.broadcast({ type: "player_move", playerId, x, y, direction: msg.direction, vx: msg.vx, vy: msg.vy }, playerId);
				break;
			}
			case "stop": {
				const x = Math.max(0, Math.min(msg.x, ROOM_CONFIG.MAP_WIDTH));
				const y = Math.max(0, Math.min(msg.y, ROOM_CONFIG.MAP_HEIGHT));
				player.state.x = x;
				player.state.y = y;
				player.state.direction = msg.direction;
				player.state.vx = 0;
				player.state.vy = 0;
				this.persistPlayerState(player.ws, player.state);
				this.broadcast({ type: "player_stop", playerId, x, y, direction: msg.direction }, playerId);
				break;
			}
			case "take_item": {
				if (player.state.holding.length >= MAX_HOLD) {
					this.sendError(player.ws, "Tangan sudah penuh (maks 2 item)");
					break;
				}
				const srcObj = this.objects.get(msg.objectId);
				if (!srcObj) break;
				const srcItem = srcObj.items.find((i) => i.itemId === msg.itemId && i.quantity > 0);
				if (!srcItem) {
					this.sendError(player.ws, "Item tidak tersedia");
					break;
				}

				srcItem.quantity -= 1;
				const baseItemId = this.itemKind(srcItem);
				const held: HeldItem = {
					itemId: this.makeHeldInstanceId(baseItemId, player.state.holding),
					baseItemId,
					name: srcItem.name,
					category: srcItem.category,
				};
				if (srcItem.weightGrams !== undefined) held.weightGrams = srcItem.weightGrams;
				if (srcItem.volumeMl !== undefined) held.volumeMl = srcItem.volumeMl;
				if (srcItem.maxVolumeMl !== undefined) held.maxVolumeMl = srcItem.maxVolumeMl;
				if (srcItem.contents) held.contents = srcItem.contents.map((c) => ({ ...c }));
				if (srcItem.labMeta) held.labMeta = { ...srcItem.labMeta };

				player.state.holding.push(held);
				this.persistPlayerState(player.ws, player.state);
				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: srcObj.items });
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
				break;
			}
			case "place_item": {
				const heldIdx = player.state.holding.findIndex((h) => h.itemId === msg.itemId);
				if (heldIdx === -1) {
					this.sendError(player.ws, "Kamu tidak memegang item itu");
					break;
				}

				const destObj = this.objects.get(msg.objectId);
				if (!destObj) break;
				const held = player.state.holding[heldIdx];
				const heldKind = this.itemKind(held);

				if (destObj.objectType === "storage" && held.category !== "alat") {
					this.sendError(player.ws, "Storage hanya untuk alat");
					break;
				}
				if (destObj.objectType === "reagent_table" && held.category !== "bahan") {
					this.sendError(player.ws, "Meja pereaksi hanya untuk bahan");
					break;
				}
				if (destObj.objectType === "timbangan" && held.category !== "alat") {
					this.sendError(player.ws, "Timbangan hanya untuk menaruh wadah");
					break;
				}
				if ((destObj.objectType === "oven" || destObj.objectType === "furnace") && (held.category !== "alat" || held.maxVolumeMl === undefined)) {
					this.sendError(player.ws, "Station ini hanya menerima wadah sampel");
					break;
				}
				if ((destObj.objectType === "oven" || destObj.objectType === "furnace") && destObj.items.some((i) => i.quantity > 0 && this.itemKind(i) !== heldKind)) {
					this.sendError(player.ws, "Station ini sedang digunakan wadah lain");
					break;
				}
				if (destObj.objectType === "oven" && heldKind === "kertas-saring" && this.hasSolid(held)) {
					this.sendError(player.ws, "Padukan kertas saring berisi endapan dengan kaca arloji sebelum dikeringkan");
					break;
				}
				if (destObj.objectType === "oven" && this.isContainer(held)) {
					const meta = held.labMeta ?? {};
					if (!meta.washed || !this.isMilestoneDone(playerId, 9) || !this.isMilestoneDone(playerId, 10)) {
						this.blockWithConcept(playerId, "dry.before_wash_test");
						break;
					}
				}
				if (destObj.objectType === "furnace" && this.isContainer(held)) {
					const meta = held.labMeta ?? {};
					if (!this.isItemKind(held, "krus-porselen") || !meta.dried || !meta.transferredToCrucible || !meta.tekluCharred) {
						this.blockWithConcept(playerId, "furnace.before_dry");
						break;
					}
				}

				let placedItem: InventoryItem;
				const shouldMerge = destObj.objectType !== "workbench";
				const existing = shouldMerge
					? destObj.items.find((i) => this.itemKind(i) === heldKind)
					: undefined;
				if (existing) {
					const wasEmpty = existing.quantity <= 0;
					existing.quantity += 1;
					if (wasEmpty) {
						existing.weightGrams = held.weightGrams;
						existing.volumeMl = held.volumeMl;
						if (held.maxVolumeMl !== undefined) existing.maxVolumeMl = held.maxVolumeMl;
						existing.labMeta = held.labMeta ? { ...held.labMeta } : undefined;
					}
					if (held.contents && held.contents.length > 0) {
						if (wasEmpty) {
							existing.contents = held.contents.map((c) => ({ ...c }));
						} else {
							if (!existing.contents) existing.contents = [];
							for (const c of held.contents) existing.contents.push({ ...c });
						}
					} else if (wasEmpty) {
						existing.contents = [];
					}
					if (!wasEmpty && held.labMeta) {
						existing.labMeta = { ...existing.labMeta, ...held.labMeta };
					}
					placedItem = existing;
				} else {
					const placedItemId = destObj.objectType === "workbench"
						? this.makeWorkbenchInstanceId(heldKind, destObj)
						: heldKind;
					const newItem: InventoryItem = {
						itemId: placedItemId,
						baseItemId: destObj.objectType === "workbench" ? heldKind : undefined,
						name: held.name,
						category: held.category,
						quantity: 1,
					};
					if (held.weightGrams !== undefined) newItem.weightGrams = held.weightGrams;
					if (held.volumeMl !== undefined) newItem.volumeMl = held.volumeMl;
					if (held.maxVolumeMl !== undefined) newItem.maxVolumeMl = held.maxVolumeMl;
					if (held.contents) newItem.contents = held.contents.map((c) => ({ ...c }));
					if (held.labMeta) newItem.labMeta = { ...held.labMeta };
					destObj.items.push(newItem);
					placedItem = newItem;
				}

				if ((destObj.objectType === "oven" || destObj.objectType === "furnace") && this.isContainer(placedItem)) {
					await this.applyStationProcess(playerId, destObj, placedItem);
				}

				player.state.holding.splice(heldIdx, 1);
				this.persistPlayerState(player.ws, player.state);
				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: destObj.items });
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
				break;
			}
			case "use_held_on_item": {
				const held = player.state.holding.find((h) => h.itemId === msg.heldItemId);
				if (!held) {
					this.sendError(player.ws, "Kamu tidak memegang item itu");
					break;
				}

				const obj = this.objects.get(msg.objectId);
				if (!obj) break;
				const target = obj.items.find((i) => i.itemId === msg.targetItemId && i.quantity > 0);
				if (!target) {
					this.sendError(player.ws, "Target tidak ditemukan");
					break;
				}

				const heldKind = this.itemKind(held);
				const targetMeta = this.ensureLabMeta(target);
				let handled = false;

				if (
					held.category === "bahan" &&
					(held.volumeMl ?? 0) > 0 &&
					this.isContainer(target) &&
					this.isItemKind(target, "tabung-reaksi") &&
					(heldKind === "hcl" || heldKind === "bacl2")
				) {
					const applied = await this.applySulfateTestReagent(playerId, held, target);
					if (!applied) {
						this.sendError(player.ws, "Wadah sudah penuh");
						break;
					}
					handled = true;
				}

				if (heldKind === "kertas-lakmus" && this.isContainer(target)) {
					if (targetMeta.precipitated && targetMeta.stirred) {
						targetMeta.precipitationChecked = true;
						await this.completeMilestone(
							playerId,
							6,
							"Kertas lakmus merah berubah biru: larutan sudah basa dan pengendapan dinyatakan sempurna",
						);
						handled = true;
					} else if (this.isFiltrateContainer(target)) {
						targetMeta.baseTested = true;
						await this.completeMilestone(playerId, 10, "Uji basa pada filtrat cucian dengan kertas lakmus selesai");
						handled = true;
					}
				}

				if (!handled) {
					this.sendError(player.ws, "Item ini belum bisa dipakai langsung ke target itu");
					break;
				}

				this.persistPlayerState(player.ws, player.state);
				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: obj.items });
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
				break;
			}
			case "weigh_item": {
				const ok = await this.applyWeighTransfer(playerId, player, msg.transferGrams);
				if (!ok) break;
				break;
			}
			case "scoop_sample": {
				// Random transfer in 0.03-0.08 g to mimic a manual spatula scoop.
				// Jittered slightly so display doesn't look grid-aligned.
				const base = 0.03 + Math.random() * 0.05;
				const jitter = (Math.random() - 0.5) * 0.004;
				const grams = Math.max(0.001, this.round4(base + jitter));

				const bahanIdx = player.state.holding.findIndex((h) => h.category === "bahan" && h.weightGrams && h.weightGrams > 0);
				if (bahanIdx === -1) {
					this.sendError(player.ws, "Kamu harus memegang bahan padat");
					break;
				}
				const available = player.state.holding[bahanIdx].weightGrams ?? 0;
				const actual = Math.min(grams, this.round4(available));
				if (actual <= 0) {
					this.sendError(player.ws, "Sampel sudah habis");
					break;
				}

				const ok = await this.applyWeighTransfer(playerId, player, actual);
				if (!ok) break;
				break;
			}
			case "pour_item": {
				const obj = this.objects.get(msg.objectId);
				if (!obj) break;

				const source = obj.items.find((i) => i.itemId === msg.sourceItemId && i.quantity > 0);
				const target = obj.items.find((i) => i.itemId === msg.targetItemId && i.quantity > 0);
				if (!source) {
					this.sendError(player.ws, "Sumber larutan tidak ditemukan");
					break;
				}
				if (!target) {
					this.sendError(player.ws, "Wadah tujuan tidak ditemukan");
					break;
				}

				if (source.category !== "bahan" || source.volumeMl === undefined || source.volumeMl <= 0) {
					this.sendError(player.ws, "Sumber harus berupa larutan bahan");
					break;
				}
				if (target.category !== "alat" || target.maxVolumeMl === undefined) {
					this.sendError(player.ws, "Tujuan harus berupa wadah");
					break;
				}

				const targetMeta = this.ensureLabMeta(target);
				const sourceKind = this.itemKind(source);
				const currentVolumeInTarget = (target.contents ?? []).reduce((sum, c) => sum + (c.volumeMl ?? 0), 0);
				const remainingCapacity = Math.max(0, this.getMaxVolume(target) - currentVolumeInTarget);
				if (remainingCapacity <= 0) {
					this.sendError(player.ws, "Wadah sudah penuh");
					break;
				}

				const isSulfateTestPour = this.isFiltrateTestTube(target) && this.isSulfateTestReagentKind(sourceKind);
				const transferMl = Math.min(
					isSulfateTestPour ? SULFATE_TEST_REAGENT_ML : msg.transferMl,
					source.volumeMl,
					remainingCapacity,
				);
				if (transferMl <= 0) {
					this.sendError(player.ws, "Volume penuangan tidak valid");
					break;
				}

				const isPengendap =
					sourceKind === "naoh" ||
					sourceKind === "naoh-1n" ||
					sourceKind === "naoh-8n" ||
					sourceKind === "koh-4n" ||
					sourceKind === "nh4oh-4n";

				if (
					sourceKind !== "air-suling" &&
					targetMeta.filtered &&
					this.hasSolid(target, "endapan-cuoh2")
				) {
					this.blockWithConcept(playerId, "dry.before_wash_test");
					break;
				}

				if (isPengendap && this.hasDissolvedTerusi(target)) {
					if (!targetMeta.boiled) {
						this.blockWithConcept(playerId, "precipitate.before_boil");
						break;
					}
					if (sourceKind === "nh4oh-4n") {
						this.blockWithConcept(playerId, "precipitate.nh4oh_complex");
						break;
					}
					if (sourceKind === "koh-4n") {
						this.blockWithConcept(playerId, "precipitate.koh_residue");
						break;
					}
					if (sourceKind === "naoh-8n") {
						this.blockWithConcept(playerId, "precipitate.too_concentrated");
						break;
					}
					if (transferMl >= 5) {
						this.blockWithConcept(playerId, "precipitate.rapid_addition");
						break;
					}
				}

				source.volumeMl = this.round4(source.volumeMl - transferMl);
				if (source.volumeMl <= 0.0001) source.volumeMl = 0;
				this.upsertLiquid(target, source.itemId, source.name, transferMl);
				if (sourceKind === "air-suling") {
					await this.completeDissolutionIfReady(playerId, target);
				}

				if (this.isItemKind(source, "h2so4") && this.hasDissolvedTerusi(target)) {
					targetMeta.acidified = true;
					const cumulativeH2so4 = this.getLiquidVolume(target, "h2so4");
					this.logDecision(target, "acidify.applied", true);
					this.logDecision(target, "acidify.h2so4VolumeMl", cumulativeH2so4);

					if (cumulativeH2so4 < 1) {
						this.sendConceptFeedback(playerId, "acidify.insufficient");
					} else {
						this.clearIssue(target, "acidify.insufficient");
						await this.completeMilestone(
							playerId,
							3,
							`Larutan diasamkan dengan ${cumulativeH2so4}mL H2SO4`,
						);
					}
				}

				// Pengendap variants — naoh (default 4N), naoh-1n, naoh-8n, koh-4n, nh4oh-4n.
				// Open-world: any alkaline reagent triggers precipitation logic. Student's
				// reagent + technique choices are logged; downstream consequences manifest
				// in applyCalcination.
				if (isPengendap && this.hasDissolvedTerusi(target)) {
					const reagentKind =
						sourceKind === "koh-4n"
							? "koh"
							: sourceKind === "nh4oh-4n"
								? "nh4oh"
								: "naoh";
					const normality =
						sourceKind === "naoh-1n" ? "1N" : sourceKind === "naoh-8n" ? "8N" : "4N";

					this.logDecision(target, "precipitate.reagentKind", reagentKind);
					this.logDecision(target, "precipitate.normality", normality);
					this.logDecision(target, "precipitate.applied", true);

					// Track addition technique via this pour's volume. A single big pour
					// (≥5mL at once) is "rapid"; many small pours means dropwise. The
					// last observation wins — if student ever did a rapid pour, keep the
					// flag (matches real-lab consequence permanence).
					const rapidThisPour = transferMl >= 5;
					const priorRapid = Boolean(targetMeta.decisions?.["precipitate.rapidAddition"]);
					this.logDecision(target, "precipitate.rapidAddition", priorRapid || rapidThisPour);

					// Issue codes — only emit if student's choice departs from the
					// standard procedure. Always clear first so a corrective action
					// (e.g. switching from nh4oh back to naoh is not possible mid-run,
					// but issues per pour should reflect current pour decisively).
					if (reagentKind === "nh4oh") {
						this.logIssue(target, "precipitate.nh4oh_complex");
					}
					if (reagentKind === "koh") {
						this.logIssue(target, "precipitate.koh_residue");
					}
					if (normality === "8N") {
						this.logIssue(target, "precipitate.too_concentrated");
					}
					if (rapidThisPour) {
						this.logIssue(target, "precipitate.rapid_addition");
					}

					// Physical effect: NH4OH forms soluble [Cu(NH3)4]2+ complex and
					// no Cu(OH)2 precipitate is produced. Other alkali produce normal
					// hydroxide precipitate; yield differences are handled at
					// applyCalcination time.
					targetMeta.precipitated = true;
					const sampleMass = targetMeta.sampleTerusiG ?? this.getSolidWeight(target, "terusi");
					if (sampleMass > 0 && reagentKind !== "nh4oh") {
						const precipMass = this.round4(sampleMass * CUOH2_FROM_TERUSI_RATIO);
						if (precipMass > 0) {
							this.upsertSolid(target, "endapan-cuoh2", "Endapan Cu(OH)2", precipMass, false);
						}
					}
				}

				if (this.isItemKind(source, "air-suling") && targetMeta.filtered && this.hasSolid(target, "endapan-cuoh2")) {
					targetMeta.washed = true;
					await this.completeMilestone(playerId, 8, "Endapan dicuci dengan air suling");
				}

				if (this.isItemKind(target, "tabung-reaksi")) {
					if (isSulfateTestPour) targetMeta.fromFiltrate = true;
					if (this.isItemKind(source, "hcl")) targetMeta.sulfateTestHclAdded = true;
					if (this.isItemKind(source, "bacl2")) targetMeta.sulfateTestBaCl2Added = true;
					await this.completeSulfateTestIfReady(playerId, target);
				}

				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: obj.items });
				break;
			}
			case "dissolve_item": {
				const obj = this.objects.get(msg.objectId);
				if (!obj) break;

				const source = obj.items.find((i) => i.itemId === msg.sourceContainerItemId && i.quantity > 0);
				const target = obj.items.find((i) => i.itemId === msg.targetContainerItemId && i.quantity > 0);
				if (!source || !target) {
					this.sendError(player.ws, "Wadah pelarutan tidak ditemukan");
					break;
				}
				if (source.category !== "alat" || target.category !== "alat") {
					this.sendError(player.ws, "Pelarutan hanya antar wadah");
					break;
				}

				const sourceSolids = (source.contents ?? []).filter((c) => (c.weightGrams ?? 0) > 0);
				if (sourceSolids.length === 0) {
					this.sendError(player.ws, "Wadah sumber tidak berisi padatan");
					break;
				}

				const dissolvingTerusi = sourceSolids.some((c) => this.contentItemKind(c.itemId) === "terusi");
				if (dissolvingTerusi) {
					const sourceMeta = this.ensureLabMeta(source);
					const sampleMass = sourceMeta.sampleTerusiG ?? this.getSolidWeight(source, "terusi");
					if (sampleMass < 0.45 || sampleMass > 0.55) {
						this.blockWithConcept(playerId, "weigh.not_ready");
						break;
					}
					if (!this.isItemKind(target, "piala-gelas")) {
						this.blockWithConcept(playerId, "dissolve.wrong_container");
						break;
					}
				}

				this.applyDissolve(source, target, sourceSolids);
				const sourceMeta = source.labMeta;
				if (sourceMeta?.sampleTerusiG !== undefined) {
					const targetMeta = this.ensureLabMeta(target);
					targetMeta.sampleTerusiG = sourceMeta.sampleTerusiG;
				}

				await this.completeDissolutionIfReady(playerId, target);

				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: obj.items });
				break;
			}
			case "combine_items": {
				const obj = this.objects.get(msg.objectId);
				if (!obj) break;

				const itemA = obj.items.find((i) => i.itemId === msg.itemIdA && i.quantity > 0);
				const itemB = obj.items.find((i) => i.itemId === msg.itemIdB && i.quantity > 0);
				if (!itemA || !itemB) {
					this.sendError(player.ws, "Item kombinasi tidak ditemukan");
					break;
				}

				const handled = await this.handleCombineRecipe(playerId, obj, itemA, itemB);
				if (!handled) {
					this.sendError(player.ws, "Kombinasi item ini belum didukung");
					break;
				}

				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: obj.items });
				break;
			}
			case "record_mass": {
				const heldContainer = player.state.holding.find((h) => h.itemId === msg.containerItemId && h.category === "alat");
				if (!heldContainer) {
					this.sendError(player.ws, "Wadah tidak sedang kamu pegang");
					break;
				}

				const cuoMassInContainer = this.getSolidWeight(heldContainer, "cuo-hasil-pijar");
				if (cuoMassInContainer <= 0) {
					this.sendError(player.ws, "Wadah belum berisi CuO hasil pijar");
					break;
				}

				const measured = this.round4(msg.measuredMassG);
				const meta = this.ensureLabMeta(heldContainer);

				if (!this.isMilestoneDone(playerId, 13)) {
					meta.lastRecordedMassG = measured;
					meta.reheatedAfterWeigh = false;
					await this.completeMilestone(playerId, 13, `Bobot CuO dicatat ${measured}g`);
				} else {
					if (!meta.reheatedAfterWeigh) {
						this.sendError(player.ws, "Lakukan pijar dan pendinginan lagi sebelum timbang ulang");
						break;
					}
					const prev = meta.lastRecordedMassG ?? measured;
					const diff = this.round4(Math.abs(prev - measured));
					meta.lastRecordedMassG = measured;
					meta.reheatedAfterWeigh = false;
					if (diff <= 0.0004) {
						const completed = await this.completeMilestone(playerId, 14, `Bobot tetap tercapai (selisih ${diff}g)`);
						if (completed) {
							this.broadcastLevelReport(playerId, heldContainer);
						}
					} else {
						this.sendError(player.ws, `Bobot belum tetap (selisih ${diff}g), ulangi pijar-dingin-timbang`);
					}
				}

				this.persistPlayerState(player.ws, player.state);
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
				break;
			}
			case "discard_object_contents": {
				const obj = this.objects.get(msg.objectId);
				if (!obj) break;

				const container = obj.items.find((i) => i.itemId === msg.itemId && i.quantity > 0);
				if (!container) {
					this.sendError(player.ws, "Wadah tidak ditemukan di meja kerja");
					break;
				}
				if (!this.isContainer(container) && !this.isItemKind(container, "corong-stand")) {
					this.sendError(player.ws, "Hanya wadah yang bisa dibuang isinya");
					break;
				}

				this.clearContainerContents(container);
				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: obj.items });
				break;
			}
			case "discard_held_contents": {
				const heldContainer = player.state.holding.find((h) => h.itemId === msg.itemId);
				if (!heldContainer) {
					this.sendError(player.ws, "Wadah tidak sedang kamu pegang");
					break;
				}
				if (!this.isContainer(heldContainer) && !this.isItemKind(heldContainer, "corong-stand")) {
					this.sendError(player.ws, "Hanya wadah yang bisa dibuang isinya");
					break;
				}

				// Capture restart signal before wiping labMeta: a terusi-containing
				// container being emptied is treated as the student restarting the
				// weighing step. Persist the count across the reset.
				const hadTerusi = (heldContainer.contents ?? []).some(
					(c) => this.contentItemKind(c.itemId) === "terusi" && (c.weightGrams ?? 0) > 0,
				);
				const prevRestartCount = hadTerusi
					? Number(heldContainer.labMeta?.decisions?.["weigh.restartCount"] ?? 0)
					: 0;

				this.clearContainerContents(heldContainer);

				if (hadTerusi) {
					this.logDecision(heldContainer, "weigh.restartCount", prevRestartCount + 1);
				}

				this.persistPlayerState(player.ws, player.state);
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
				break;
			}
			case "detach_setup_part": {
				const obj = this.objects.get(msg.objectId);
				if (!obj) break;

				const setupItem = obj.items.find((i) => i.itemId === msg.setupItemId && i.quantity > 0);
				if (!setupItem || !this.isItemKind(setupItem, "corong-stand")) {
					this.sendError(player.ws, "Setup corong tidak ditemukan");
					break;
				}

				const detached = this.detachSetupPart(obj, setupItem, msg.part);
				if (!detached) {
					this.sendError(player.ws, "Bagian setup tidak bisa dilepas");
					break;
				}

				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: obj.items });
				break;
			}
		}
	}

	private async handleCombineRecipe(playerId: string, obj: GameObjectState, itemA: InventoryItem, itemB: InventoryItem): Promise<boolean> {
		const setupItem = this.isItemKind(itemA, "corong-stand") ? itemA : this.isItemKind(itemB, "corong-stand") ? itemB : null;
		const setupOther = setupItem ? (setupItem === itemA ? itemB : itemA) : null;

		if (setupItem && setupOther) {
			if (this.isItemKind(setupOther, "kertas-saring")) {
				if (this.attachFilterPaperToSetup(setupItem, setupOther)) {
					return true;
				}
			}

			if (setupOther.category === "bahan" && this.isItemKind(setupOther, "air-suling") && (setupOther.volumeMl ?? 0) > 0) {
				const setupMeta = this.ensureLabMeta(setupItem);
				const hasResidue = (setupItem.contents ?? []).some((c) => (c.weightGrams ?? 0) > 0);
				if (setupMeta.setupFilterPaperAttached && setupMeta.setupReceiverAttached && hasResidue) {
					const receiverMaxVolume = setupMeta.setupReceiverMaxVolumeMl ?? 0;
					const receiverCurrentVolume = this.getContentsVolume(setupMeta.setupReceiverContents);
					const availableVolume = Math.max(0, receiverMaxVolume - receiverCurrentVolume);
					const rinseMl = Math.min(setupOther.volumeMl ?? 0, 20, availableVolume);
					if (rinseMl > 0) {
						setupOther.volumeMl = this.round4((setupOther.volumeMl ?? 0) - rinseMl);
						if ((setupOther.volumeMl ?? 0) <= 0.0001) setupOther.volumeMl = 0;

						if (!setupMeta.setupReceiverContents) setupMeta.setupReceiverContents = [];
						this.mergeContents(setupMeta.setupReceiverContents, [
							{ itemId: setupOther.itemId, name: setupOther.name, volumeMl: rinseMl },
						]);
						setupMeta.setupReceiverFromFiltrate = true;
						setupMeta.washed = true;
						await this.completeMilestone(playerId, 8, "Endapan pada kertas saring dicuci dengan air suling");
						return true;
					}
				}
			}

			if (this.isContainer(setupOther)) {
				const setupMeta = this.ensureLabMeta(setupItem);
				const otherMeta = this.ensureLabMeta(setupOther);

				const setupReadyForFiltration = Boolean(
					setupMeta.setupFilterPaperAttached && setupMeta.setupReceiverAttached,
				);
				if (setupReadyForFiltration && otherMeta.precipitated) {
					if (await this.runFiltrationIntoSetup(playerId, setupOther, setupItem)) {
						return true;
					}
				}

				if (this.isItemKind(setupOther, "piala-gelas") && !setupMeta.setupReceiverAttached) {
					if (this.attachReceiverToSetup(setupItem, setupOther)) {
						return true;
					}
				}

				if (this.isItemKind(setupOther, "tabung-reaksi") && setupMeta.setupReceiverAttached && setupMeta.setupReceiverFromFiltrate) {
					if (this.transferFiltrateAliquot(setupMeta.setupReceiverContents, setupOther)) {
						return true;
					}
				}
			}
		}

		const filterItem = this.isItemKind(itemA, "kertas-saring") ? itemA : this.isItemKind(itemB, "kertas-saring") ? itemB : null;
		const watchGlassItem = this.isItemKind(itemA, "kaca-arloji") ? itemA : this.isItemKind(itemB, "kaca-arloji") ? itemB : null;
		if (filterItem && watchGlassItem) {
			if (this.moveFilterResidueToWatchGlass(filterItem, watchGlassItem)) {
				return true;
			}
		}

		const crucibleItem = this.isItemKind(itemA, "krus-porselen") ? itemA : this.isItemKind(itemB, "krus-porselen") ? itemB : null;
		const residueSourceItem = crucibleItem ? (crucibleItem === itemA ? itemB : itemA) : null;
		if (crucibleItem && residueSourceItem) {
			if (this.moveDriedResidueToCrucible(residueSourceItem, crucibleItem)) {
				return true;
			}
		}

		const containerA = this.isContainer(itemA) ? itemA : null;
		const containerB = this.isContainer(itemB) ? itemB : null;

		if (containerA && containerB) {
			const source = this.ensureLabMeta(containerA).fromFiltrate
				? containerA
				: this.ensureLabMeta(containerB).fromFiltrate
					? containerB
					: null;
			const target = this.isItemKind(containerA, "tabung-reaksi") ? containerA : this.isItemKind(containerB, "tabung-reaksi") ? containerB : null;
			if (source && target) {
				if (this.transferFiltrateAliquot(source.contents, target)) {
					return true;
				}
			}
		}

		const toolItem = !containerA && containerB ? itemA : containerA && !containerB ? itemB : null;
		const container = containerA ?? containerB;
		if (container && toolItem) {
			const meta = this.ensureLabMeta(container);

			if (
				toolItem.category === "bahan" &&
				(toolItem.volumeMl ?? 0) > 0 &&
				this.isFiltrateTestTube(container) &&
				this.isSulfateTestReagentKind(this.itemKind(toolItem))
			) {
				if (await this.applySulfateTestReagent(playerId, toolItem, container)) {
					return true;
				}
			}

			if (this.isItemKind(toolItem, "hot-plate") && this.isItemKind(container, "krus-porselen") && meta.dried) {
				if (!meta.transferredToCrucible) {
					this.blockWithConcept(playerId, "furnace.before_dry");
					return true;
				}
				meta.tekluCharred = true;
				return true;
			}

			if (this.isItemKind(toolItem, "hot-plate") && this.hasDissolvedTerusi(container)) {
				if (!meta.acidified || this.getLiquidVolume(container, "h2so4") < 1) {
					this.logDecision(container, "boil.applied", false);
					this.logDecision(container, "boil.preAcidified", Boolean(meta.acidified));
					this.blockWithConcept(playerId, meta.acidified ? "acidify.insufficient" : "boil.no_acidify");
					return true;
				}

				meta.boiled = true;
				this.logDecision(container, "boil.applied", true);
				this.logDecision(container, "boil.preAcidified", true);
				this.clearIssue(container, "boil.no_acidify");

				await this.completeMilestone(playerId, 4, "Larutan dididihkan di teklu");
				return true;
			}

			if (this.isItemKind(toolItem, "pengaduk-kaca") && meta.precipitated) {
				meta.stirred = true;
				await this.completeMilestone(playerId, 5, "Endapan dibentuk dan diaduk");
				return true;
			}

			if (this.isItemKind(toolItem, "kertas-lakmus")) {
				if (meta.precipitated && meta.stirred) {
					meta.precipitationChecked = true;
					await this.completeMilestone(
						playerId,
						6,
						"Kertas lakmus merah berubah biru: larutan sudah basa dan pengendapan dinyatakan sempurna",
					);
					return true;
				}
				if (this.isFiltrateContainer(container)) {
					meta.baseTested = true;
					await this.completeMilestone(playerId, 10, "Uji basa pada filtrat cucian dengan kertas lakmus selesai");
					return true;
				}
			}

			if (this.isItemKind(toolItem, "oven-lab") && (meta.filtered || meta.washed)) {
				if (this.isItemKind(container, "kertas-saring") && this.hasSolid(container)) {
					return false;
				}
				if (!meta.washed || !this.isMilestoneDone(playerId, 9) || !this.isMilestoneDone(playerId, 10)) {
					this.blockWithConcept(playerId, "dry.before_wash_test");
					return true;
				}
				meta.dried = true;
				await this.completeMilestone(playerId, 11, "Endapan dikeringkan di oven");
				return true;
			}

			if ((this.isItemKind(toolItem, "meker") || this.isItemKind(toolItem, "furnace-lab")) && (meta.filtered || meta.washed || meta.dried || meta.calcined || meta.cooled)) {
				if (!this.isItemKind(container, "krus-porselen") || !meta.dried || !meta.transferredToCrucible || !meta.tekluCharred) {
					this.blockWithConcept(playerId, "furnace.before_dry");
					return true;
				}
				meta.calcined = true;
				meta.cooled = false;
				this.applyCalcination(container);
				return true;
			}

			if (this.isItemKind(toolItem, "desikator") && meta.calcined) {
				meta.cooled = true;
				if (this.isMilestoneDone(playerId, 13) && meta.lastRecordedMassG !== undefined) {
					meta.reheatedAfterWeigh = true;
				}
				await this.completeMilestone(playerId, 12, "Sampel dipijarkan lalu didinginkan di desikator");
				return true;
			}
		}

		if (containerA && containerB) {
			const solidsA = (containerA.contents ?? []).filter((c) => (c.weightGrams ?? 0) > 0);
			if (solidsA.length > 0) {
				this.applyDissolve(containerA, containerB, solidsA);
				if (containerA.labMeta?.sampleTerusiG !== undefined) {
					this.ensureLabMeta(containerB).sampleTerusiG = containerA.labMeta.sampleTerusiG;
				}
				await this.completeDissolutionIfReady(playerId, containerB);
				return true;
			}
			const solidsB = (containerB.contents ?? []).filter((c) => (c.weightGrams ?? 0) > 0);
			if (solidsB.length > 0) {
				this.applyDissolve(containerB, containerA, solidsB);
				if (containerB.labMeta?.sampleTerusiG !== undefined) {
					this.ensureLabMeta(containerA).sampleTerusiG = containerB.labMeta.sampleTerusiG;
				}
				await this.completeDissolutionIfReady(playerId, containerA);
				return true;
			}
		}

		return false;
	}

	/**
	 * Catalog of deviation effects applied at calcination.
	 * Keep this as the single source of truth — computeLevelReport reads the
	 * same rules to fill per-issue impactMassG.
	 *
	 * `multiplier` scales the ideal CuO mass (compounding if multiple issues).
	 * `additiveG` adds a fixed mass after multipliers (represents extra residue
	 * that inflates the final weigh-out).
	 */
	private readonly issueImpactRules: Record<string, { multiplier?: number; additiveG?: number }> = {
		"precipitate.nh4oh_complex": { multiplier: 0.2 },
		"boil.no_acidify": { multiplier: 0.88 },
		"precipitate.too_concentrated": { multiplier: 0.92 },
		"precipitate.rapid_addition": { multiplier: 0.95 },
		"precipitate.koh_residue": { additiveG: 0.0009 },
	};

	private applyIssueEffects(
		baseCuoMass: number,
		issues: string[],
	): { finalMass: number; perIssueImpact: Record<string, number> } {
		let multiplierProduct = 1;
		let additive = 0;
		const mults: Array<{ code: string; factor: number }> = [];
		const addi: Array<{ code: string; g: number }> = [];

		for (const code of issues) {
			const rule = this.issueImpactRules[code];
			if (!rule) continue;
			if (rule.multiplier !== undefined) {
				multiplierProduct *= rule.multiplier;
				mults.push({ code, factor: rule.multiplier });
			}
			if (rule.additiveG !== undefined) {
				additive += rule.additiveG;
				addi.push({ code, g: rule.additiveG });
			}
		}

		const finalMass = this.round4(Math.max(baseCuoMass * multiplierProduct + additive, 0));

		// Attribute impact per issue. For multipliers, impact = baseCuoMass *
		// (1 - factor) scaled by product of the other multipliers (so total
		// impacts sum to the actual difference).
		const perIssueImpact: Record<string, number> = {};
		for (const { code, factor } of mults) {
			const others = mults
				.filter((m) => m.code !== code)
				.reduce((p, m) => p * m.factor, 1);
			perIssueImpact[code] = this.round4(baseCuoMass * others * (factor - 1));
		}
		for (const { code, g } of addi) {
			perIssueImpact[code] = this.round4(g);
		}
		return { finalMass, perIssueImpact };
	}

	private applyCalcination(container: InventoryItem): void {
		const meta = this.ensureLabMeta(container);
		const firstCalcination = meta.cuoMassG === undefined;

		if (firstCalcination) {
			const fromSample = (meta.sampleTerusiG ?? 0) * CUO_FROM_TERUSI_RATIO;
			const precipMass = this.getSolidWeight(container, "endapan-cuoh2");
			const fromPrecip = precipMass * 0.8155;
			const idealCuo = this.round4(Math.max(fromSample, fromPrecip));

			const issues = meta.outcomes?.issues ?? [];
			const { finalMass } = this.applyIssueEffects(idealCuo, issues);
			meta.cuoMassG = finalMass;
		} else {
			// Reheat iteration — small equilibrium loss (matches bobot-tetap simulation).
			meta.cuoMassG = this.round4(Math.max((meta.cuoMassG ?? 0) - 0.0002, 0));
		}

		if (container.contents) {
			container.contents = container.contents.filter((c) => this.contentItemKind(c.itemId) !== "endapan-cuoh2");
		}
		if ((meta.cuoMassG ?? 0) > 0) {
			this.upsertSolid(container, "cuo-hasil-pijar", "CuO (hasil pijar)", meta.cuoMassG!, false);
		}
	}

	private applyDissolve(source: InventoryItem, target: InventoryItem, sourceSolids: ContainerContent[]): void {
		const targetHasWater = this.getLiquidVolume(target, "air-suling") > 0;
		for (const solid of sourceSolids) {
			const grams = solid.weightGrams ?? 0;
			if (grams <= 0) continue;
			this.upsertSolid(target, solid.itemId, solid.name, grams, targetHasWater);
		}

		if (source.contents) {
			source.contents = source.contents.filter((c) => (c.weightGrams ?? 0) <= 0);
		}
	}

	private async applyStationProcess(playerId: string, destObj: GameObjectState, item: InventoryItem): Promise<void> {
		if (destObj.objectType === "oven") {
			const meta = this.ensureLabMeta(item);
			if (meta.filtered || meta.washed) {
				meta.dried = true;
				await this.completeMilestone(playerId, 11, "Endapan dikeringkan di oven");
			}
			return;
		}

		if (destObj.objectType === "furnace") {
			const meta = this.ensureLabMeta(item);
			if (this.isItemKind(item, "krus-porselen") && meta.dried && meta.transferredToCrucible && meta.tekluCharred) {
				meta.calcined = true;
				meta.cooled = false;
				this.applyCalcination(item);
			}
		}
	}

	private broadcast(msg: ServerMessage, excludePlayerId?: string): void {
		const data = JSON.stringify(msg);
		for (const [id, player] of this.players) {
			if (id === excludePlayerId) continue;
			try {
				player.ws.send(data);
			} catch {
				// dead connection
			}
		}
	}

	private rehydratePlayers(): void {
		for (const ws of this.ctx.getWebSockets()) {
			const attachment = ws.deserializeAttachment() as PlayerSocketAttachment | null;
			const playerState = attachment?.playerState;

			if (!playerState) {
				try {
					ws.close(1011, "Missing player state");
				} catch {
					// already closed
				}
				continue;
			}

			if (!Array.isArray(playerState.holding)) {
				playerState.holding = [];
			}

			this.players.set(playerState.id, { ws, state: playerState });
		}
	}

	private sendError(ws: WebSocket, message: string): void {
		ws.send(JSON.stringify({ type: "error", message } satisfies ServerMessage));
	}

	private persistPlayerState(ws: WebSocket, playerState: PlayerState): void {
		ws.serializeAttachment({ playerState: { ...playerState } } satisfies PlayerSocketAttachment);
	}
}
