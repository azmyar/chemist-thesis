import { DurableObject } from "cloudflare:workers";
import {
	type ClientMessage,
	type ContainerContent,
	type Direction,
	type GameObjectState,
	type HeldItem,
	type InventoryItem,
	type LabContainerMeta,
	type LevelState,
	type PlayerState,
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

const LEVEL_MILESTONES = [
	"Timbang terusi ±0,5g ke kaca arloji",
	"Larutkan terusi dengan 100mL air suling di piala gelas",
	"Tambahkan H2SO4 4N sampai larutan biru jernih",
	"Didihkan larutan di hot plate",
	"Endapkan dengan NaOH 4N sambil diaduk",
	"Uji pengendapan sempurna",
	"Saring endapan lewat setup corong + kertas saring + piala penampung",
	"Cuci endapan dengan air suling",
	"Uji pengotor sulfat (HCl + BaCl2)",
	"Uji basa dengan kertas lakmus",
	"Keringkan endapan di oven",
	"Pijarkan di furnace lalu dinginkan di desikator",
	"Timbang residu CuO",
	"Ulangi pijar-dingin-timbang sampai bobot tetap",
] as const;

const STEP_XP = [60, 80, 70, 60, 90, 70, 100, 80, 90, 60, 80, 120, 80, 140] as const;

type ContainerLike = InventoryItem | HeldItem;

export class GameRoom extends DurableObject {
	private players: Map<string, PlayerConnection> = new Map();
	private objects: Map<string, GameObjectState> = new Map();
	private levelState: LevelState | null = null;
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
		if (this.objects.size > 0 && this.levelState) return;
		let shouldPersist = false;

		const storedObjects = await this.ctx.storage.get<Record<string, GameObjectState>>("objects");
		const storedLevel = await this.ctx.storage.get<LevelState>("levelState");

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
		if (!this.objects.has("furnace-1")) {
			this.objects.set("furnace-1", {
				id: "furnace-1",
				objectType: "furnace",
				items: [],
			});
			shouldPersist = true;
		}

		if (this.splitWorkbenchStacks()) {
			shouldPersist = true;
		}

		if (storedLevel && Array.isArray(storedLevel.milestones) && storedLevel.milestones.length === 14) {
			this.levelState = storedLevel;
		} else {
			this.levelState = this.createDefaultLevelState();
			shouldPersist = true;
		}

		if (shouldPersist || !storedObjects || !storedLevel) {
			await this.persistState();
		}
	}

	private async persistState(): Promise<void> {
		const data: Record<string, GameObjectState> = {};
		for (const [id, obj] of this.objects) {
			data[id] = obj;
		}
		await this.ctx.storage.put("objects", data);
		if (this.levelState) {
			await this.ctx.storage.put("levelState", this.levelState);
		}
	}

	private initDefaults(): void {
		this.objects.set("workbench-1", {
			id: "workbench-1",
			objectType: "workbench",
			items: [],
		});

		this.objects.set("timbangan-1", {
			id: "timbangan-1",
			objectType: "timbangan",
			items: [],
		});

		this.objects.set("oven-1", {
			id: "oven-1",
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
				{ itemId: "hot-plate", name: "Hot Plate", category: "alat", quantity: 1 },
				{ itemId: "corong-stand", name: "Corong + Stand", category: "alat", quantity: 1 },
				{ itemId: "kertas-saring", name: "Kertas Saring Whatman", category: "alat", quantity: 3, maxVolumeMl: 20, contents: [] },
				{ itemId: "erlenmeyer", name: "Erlenmeyer", category: "alat", quantity: 1, maxVolumeMl: 250, contents: [] },
				{ itemId: "tabung-reaksi", name: "Tabung Reaksi", category: "alat", quantity: 2, maxVolumeMl: 10, contents: [] },
				{ itemId: "kertas-lakmus", name: "Kertas Lakmus Merah", category: "alat", quantity: 5 },
				{ itemId: "krus-porselen", name: "Krus Porselen", category: "alat", quantity: 1, maxVolumeMl: 30, contents: [] },
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
				{ itemId: "bacl2", name: "BaCl2 0,5N", category: "bahan", quantity: 1, volumeMl: 50 },
				{ itemId: "hcl", name: "HCl 4N", category: "bahan", quantity: 1, volumeMl: 50 },
			],
		});
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

	private async runFiltrationIntoSetup(sourceItem: InventoryItem, setupItem: InventoryItem): Promise<boolean> {
		const setupMeta = this.ensureLabMeta(setupItem);
		if (!setupMeta.setupFilterPaperAttached || !setupMeta.setupReceiverAttached) {
			return false;
		}

		const sourceMeta = this.ensureLabMeta(sourceItem);
		if (!sourceMeta.precipitated) {
			return false;
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
		setupMeta.precipitated = true;
		setupMeta.filtered = true;
		sourceItem.contents = [];
		sourceMeta.filtered = true;

		await this.completeMilestone(7, "Penyaringan via setup corong + kertas saring + piala penampung berhasil");
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
				sampleTerusiG: setupMeta.sampleTerusiG,
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

	private isMilestoneDone(step: number): boolean {
		if (!this.levelState) return false;
		const milestone = this.levelState.milestones[step - 1];
		return Boolean(milestone?.completed);
	}

	private async completeMilestone(step: number, detail: string): Promise<boolean> {
		if (!this.levelState) return false;
		const idx = step - 1;
		if (idx < 0 || idx >= this.levelState.milestones.length) return false;
		const milestone = this.levelState.milestones[idx];
		if (milestone.completed) return false;
		if (idx > 0 && !this.levelState.milestones[idx - 1].completed) {
			return false;
		}

		const now = Date.now();
		milestone.completed = true;
		milestone.completedAt = now;
		milestone.detail = detail;
		this.levelState.xp += STEP_XP[idx];
		this.levelState.updatedAt = now;
		this.levelState.lastEvent = `Milestone ${step} tercapai: ${milestone.title}`;
		this.levelState.finished = this.levelState.milestones.every((m) => m.completed);

		await this.persistState();
		this.broadcast({ type: "level_state", level: this.levelState });
		return true;
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
			weigh_item: { max: 10, windowMs: 3000 },
			pour_item: { max: 10, windowMs: 3000 },
			dissolve_item: { max: 10, windowMs: 3000 },
			combine_items: { max: 10, windowMs: 3000 },
			record_mass: { max: 10, windowMs: 3000 },
			discard_object_contents: { max: 12, windowMs: 3000 },
			discard_held_contents: { max: 12, windowMs: 3000 },
			detach_setup_part: { max: 12, windowMs: 3000 },
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
		const spawnCenterX = Math.floor(ROOM_CONFIG.MAP_COLS / 2) * ts + ts / 2;
		const spawnCenterY = Math.floor(ROOM_CONFIG.MAP_ROWS / 2) * ts + ts / 2;
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

		if (this.levelState) {
			server.send(JSON.stringify({ type: "level_state", level: this.levelState } satisfies ServerMessage));
		}

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

	private async handleClientMessage(playerId: string, player: PlayerConnection, msg: ClientMessage): Promise<void> {
		switch (msg.type) {
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
					await this.applyStationProcess(destObj, placedItem);
				}

				player.state.holding.splice(heldIdx, 1);
				this.persistPlayerState(player.ws, player.state);
				await this.persistState();
				this.broadcast({ type: "object_items_changed", objectId: msg.objectId, items: destObj.items });
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
				break;
			}
			case "weigh_item": {
				const bahanIdx = player.state.holding.findIndex((h) => h.category === "bahan" && h.weightGrams && h.weightGrams > 0);
				const containerIdx = player.state.holding.findIndex((h) => h.category === "alat" && h.maxVolumeMl !== undefined);

				if (bahanIdx === -1) {
					this.sendError(player.ws, "Kamu harus memegang bahan padat");
					break;
				}
				if (containerIdx === -1) {
					this.sendError(player.ws, "Kamu harus memegang wadah");
					break;
				}

				const bahan = player.state.holding[bahanIdx];
				const container = player.state.holding[containerIdx];

				if (msg.transferGrams > (bahan.weightGrams ?? 0)) {
					this.sendError(player.ws, "Berat transfer melebihi berat bahan");
					break;
				}

				bahan.weightGrams = this.round4((bahan.weightGrams ?? 0) - msg.transferGrams);
				if (!container.contents) container.contents = [];
				const bahanKind = this.itemKind(bahan);
				const existingContent = container.contents.find((c) => this.contentItemKind(c.itemId) === bahanKind);
				if (existingContent && existingContent.weightGrams !== undefined) {
					existingContent.weightGrams = this.round4(existingContent.weightGrams + msg.transferGrams);
				} else {
					container.contents.push({ itemId: bahanKind, name: bahan.name, weightGrams: msg.transferGrams });
				}

				if (this.isItemKind(bahan, "terusi") && this.isItemKind(container, "kaca-arloji")) {
					const meta = this.ensureLabMeta(container);
					meta.sampleTerusiG = this.round4((meta.sampleTerusiG ?? 0) + msg.transferGrams);
					const sample = meta.sampleTerusiG ?? 0;
					if (sample >= 0.45 && sample <= 0.55) {
						await this.completeMilestone(1, `Sampel terusi ditimbang ${sample}g`);
					}
				}

				if (bahan.weightGrams <= 0) {
					player.state.holding.splice(bahanIdx, 1);
				}

				this.persistPlayerState(player.ws, player.state);
				this.broadcast({ type: "player_hold", playerId, holding: player.state.holding });
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

				const currentVolumeInTarget = (target.contents ?? []).reduce((sum, c) => sum + (c.volumeMl ?? 0), 0);
				const remainingCapacity = Math.max(0, target.maxVolumeMl - currentVolumeInTarget);
				if (remainingCapacity <= 0) {
					this.sendError(player.ws, "Wadah sudah penuh");
					break;
				}

				const transferMl = Math.min(msg.transferMl, source.volumeMl, remainingCapacity);
				if (transferMl <= 0) {
					this.sendError(player.ws, "Volume penuangan tidak valid");
					break;
				}

				source.volumeMl = this.round4(source.volumeMl - transferMl);
				if (source.volumeMl <= 0.0001) source.volumeMl = 0;
				this.upsertLiquid(target, source.itemId, source.name, transferMl);

				const targetMeta = this.ensureLabMeta(target);
				if (this.isItemKind(source, "h2so4") && this.hasDissolvedTerusi(target)) {
					targetMeta.acidified = true;
					await this.completeMilestone(3, "Larutan diasamkan dengan H2SO4");
				}

				if (this.isItemKind(source, "naoh") && targetMeta.boiled && this.hasDissolvedTerusi(target)) {
					targetMeta.precipitated = true;
					const sampleMass = targetMeta.sampleTerusiG ?? this.getSolidWeight(target, "terusi");
					if (sampleMass > 0) {
						const precipMass = this.round4(sampleMass * CUOH2_FROM_TERUSI_RATIO);
						if (precipMass > 0) this.upsertSolid(target, "endapan-cuoh2", "Endapan Cu(OH)2", precipMass, false);
					}
				}

				if (this.isItemKind(source, "air-suling") && targetMeta.filtered && this.hasSolid(target, "endapan-cuoh2")) {
					targetMeta.washed = true;
					await this.completeMilestone(8, "Endapan dicuci dengan air suling");
				}

				if (this.isItemKind(target, "tabung-reaksi")) {
					if (this.isItemKind(source, "hcl")) targetMeta.sulfateTestHclAdded = true;
					if (this.isItemKind(source, "bacl2")) targetMeta.sulfateTestBaCl2Added = true;
					if (targetMeta.fromFiltrate && targetMeta.sulfateTestHclAdded && targetMeta.sulfateTestBaCl2Added) {
						await this.completeMilestone(9, "Uji sulfat selesai dengan HCl dan BaCl2");
					}
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

				const hasLiquidInTarget = (target.contents ?? []).some((c) => (c.volumeMl ?? 0) > 0);
				if (!hasLiquidInTarget) {
					this.sendError(player.ws, "Wadah target harus berisi larutan");
					break;
				}

				this.applyDissolve(source, target, sourceSolids);
				const sourceMeta = source.labMeta;
				if (sourceMeta?.sampleTerusiG !== undefined) {
					const targetMeta = this.ensureLabMeta(target);
					targetMeta.sampleTerusiG = sourceMeta.sampleTerusiG;
				}

				if (this.isItemKind(target, "piala-gelas")) {
					const dissolvedTerusi = this.getSolidWeight(target, "terusi");
					const waterVolume = this.getLiquidVolume(target, "air-suling");
					if (dissolvedTerusi > 0 && waterVolume >= 100) {
						await this.completeMilestone(2, "Terusi berhasil dilarutkan dalam 100mL air suling");
					}
				}

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

				const handled = await this.handleCombineRecipe(obj, itemA, itemB);
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

				if (!this.isMilestoneDone(13)) {
					meta.lastRecordedMassG = measured;
					meta.reheatedAfterWeigh = false;
					await this.completeMilestone(13, `Bobot CuO dicatat ${measured}g`);
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
						await this.completeMilestone(14, `Bobot tetap tercapai (selisih ${diff}g)`);
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

				this.clearContainerContents(heldContainer);
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

	private async handleCombineRecipe(obj: GameObjectState, itemA: InventoryItem, itemB: InventoryItem): Promise<boolean> {
		const setupItem = this.isItemKind(itemA, "corong-stand") ? itemA : this.isItemKind(itemB, "corong-stand") ? itemB : null;
		const setupOther = setupItem ? (setupItem === itemA ? itemB : itemA) : null;

		if (setupItem && setupOther) {
			if (this.isItemKind(setupOther, "kertas-saring")) {
				if (this.attachFilterPaperToSetup(setupItem, setupOther)) {
					return true;
				}
			}

			if (this.isItemKind(setupOther, "kertas-lakmus")) {
				const setupMeta = this.ensureLabMeta(setupItem);
				const hasResidue = (setupItem.contents ?? []).some((c) => (c.weightGrams ?? 0) > 0);
				if (setupMeta.washed && hasResidue) {
					setupMeta.baseTested = true;
					await this.completeMilestone(10, "Uji basa dengan lakmus pada setup penyaring selesai");
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
						await this.completeMilestone(8, "Endapan pada kertas saring dicuci dengan air suling");
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
					if (await this.runFiltrationIntoSetup(setupOther, setupItem)) {
						return true;
					}
				}

				if (this.isItemKind(setupOther, "piala-gelas") && !setupMeta.setupReceiverAttached) {
					if (this.attachReceiverToSetup(setupItem, setupOther)) {
						return true;
					}
				}

				if (this.isItemKind(setupOther, "tabung-reaksi") && setupMeta.setupReceiverAttached && setupMeta.setupReceiverFromFiltrate) {
					const srcLiquid = (setupMeta.setupReceiverContents ?? []).find((c) => (c.volumeMl ?? 0) > 0);
					if (srcLiquid && (srcLiquid.volumeMl ?? 0) > 0) {
						const transfer = Math.min(5, srcLiquid.volumeMl ?? 0);
						srcLiquid.volumeMl = this.round4((srcLiquid.volumeMl ?? 0) - transfer);
						if ((srcLiquid.volumeMl ?? 0) <= 0.0001) srcLiquid.volumeMl = 0;
						this.upsertLiquid(setupOther, srcLiquid.itemId, srcLiquid.name, transfer);
						this.ensureLabMeta(setupOther).fromFiltrate = true;
						return true;
					}
				}
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
				const srcLiquid = (source.contents ?? []).find((c) => (c.volumeMl ?? 0) > 0);
				if (srcLiquid && (srcLiquid.volumeMl ?? 0) > 0) {
					const transfer = Math.min(5, srcLiquid.volumeMl ?? 0);
					srcLiquid.volumeMl = this.round4((srcLiquid.volumeMl ?? 0) - transfer);
					this.upsertLiquid(target, srcLiquid.itemId, srcLiquid.name, transfer);
					this.ensureLabMeta(target).fromFiltrate = true;
					return true;
				}
			}
		}

		const toolItem = !containerA && containerB ? itemA : containerA && !containerB ? itemB : null;
		const container = containerA ?? containerB;
		if (container && toolItem) {
			const meta = this.ensureLabMeta(container);

			if (this.isItemKind(toolItem, "hot-plate") && meta.acidified) {
				meta.boiled = true;
				await this.completeMilestone(4, "Larutan dididihkan di hot plate");
				return true;
			}

			if (this.isItemKind(toolItem, "pengaduk-kaca") && meta.precipitated) {
				meta.stirred = true;
				await this.completeMilestone(5, "Endapan dibentuk dan diaduk");
				return true;
			}

			if (this.isItemKind(toolItem, "kertas-lakmus")) {
				if (meta.precipitated && meta.stirred) {
					meta.precipitationChecked = true;
					await this.completeMilestone(6, "Pengendapan sempurna terverifikasi");
					return true;
				}
				if (meta.washed) {
					meta.baseTested = true;
					await this.completeMilestone(10, "Uji basa dengan lakmus selesai");
					return true;
				}
			}

			if (this.isItemKind(toolItem, "oven-lab") && (meta.filtered || meta.washed)) {
				meta.dried = true;
				await this.completeMilestone(11, "Endapan dikeringkan di oven");
				return true;
			}

			if (this.isItemKind(toolItem, "furnace-lab") && (meta.dried || meta.calcined || meta.cooled)) {
				meta.calcined = true;
				meta.cooled = false;
				this.applyCalcination(container);
				return true;
			}

			if (this.isItemKind(toolItem, "desikator") && meta.calcined) {
				meta.cooled = true;
				if (this.isMilestoneDone(13) && meta.lastRecordedMassG !== undefined) {
					meta.reheatedAfterWeigh = true;
				}
				await this.completeMilestone(12, "Sampel dipijarkan lalu didinginkan di desikator");
				return true;
			}
		}

		if (containerA && containerB) {
			const solidsA = (containerA.contents ?? []).filter((c) => (c.weightGrams ?? 0) > 0);
			const hasLiquidB = (containerB.contents ?? []).some((c) => (c.volumeMl ?? 0) > 0);
			if (solidsA.length > 0 && hasLiquidB) {
				this.applyDissolve(containerA, containerB, solidsA);
				return true;
			}
			const solidsB = (containerB.contents ?? []).filter((c) => (c.weightGrams ?? 0) > 0);
			const hasLiquidA = (containerA.contents ?? []).some((c) => (c.volumeMl ?? 0) > 0);
			if (solidsB.length > 0 && hasLiquidA) {
				this.applyDissolve(containerB, containerA, solidsB);
				return true;
			}
		}

		return false;
	}

	private applyCalcination(container: InventoryItem): void {
		const meta = this.ensureLabMeta(container);
		const fromSample = (meta.sampleTerusiG ?? 0) * CUO_FROM_TERUSI_RATIO;
		const precipMass = this.getSolidWeight(container, "endapan-cuoh2");
		const fromPrecip = precipMass * 0.8155;
		let cuoMass = meta.cuoMassG ?? this.round4(Math.max(fromSample, fromPrecip));
		if (meta.cuoMassG !== undefined) {
			cuoMass = this.round4(Math.max(meta.cuoMassG - 0.0002, 0));
		}
		meta.cuoMassG = cuoMass;

		if (container.contents) {
			container.contents = container.contents.filter((c) => this.contentItemKind(c.itemId) !== "endapan-cuoh2");
		}
		if (cuoMass > 0) {
			this.upsertSolid(container, "cuo-hasil-pijar", "CuO (hasil pijar)", cuoMass, false);
		}
	}

	private applyDissolve(source: InventoryItem, target: InventoryItem, sourceSolids: ContainerContent[]): void {
		for (const solid of sourceSolids) {
			const grams = solid.weightGrams ?? 0;
			if (grams <= 0) continue;
			this.upsertSolid(target, solid.itemId, solid.name, grams, true);
		}

		if (source.contents) {
			source.contents = source.contents.filter((c) => (c.weightGrams ?? 0) <= 0);
		}
	}

	private async applyStationProcess(destObj: GameObjectState, item: InventoryItem): Promise<void> {
		if (destObj.objectType === "oven") {
			const meta = this.ensureLabMeta(item);
			if (meta.filtered || meta.washed) {
				meta.dried = true;
				await this.completeMilestone(11, "Endapan dikeringkan di oven");
			}
			return;
		}

		if (destObj.objectType === "furnace") {
			const meta = this.ensureLabMeta(item);
			if (meta.dried || meta.calcined || meta.cooled) {
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
