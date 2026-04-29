export type Direction = "up" | "down" | "left" | "right";
export type ItemCategory = "alat" | "bahan";
export type GameObjectType = "workbench" | "storage" | "reagent_table" | "timbangan" | "oven" | "furnace";

export interface ContainerContent {
	itemId: string;
	name: string;
	weightGrams?: number;
	volumeMl?: number;
	dissolved?: boolean;
}

export type DecisionValue = string | number | boolean;

export interface ContainerOutcomes {
	issues?: string[];
	massErrorG?: number;
}

export interface LabContainerMeta {
	sampleTerusiG?: number;
	acidified?: boolean;
	boiled?: boolean;
	precipitated?: boolean;
	stirred?: boolean;
	precipitationChecked?: boolean;
	filtered?: boolean;
	washed?: boolean;
	fromFiltrate?: boolean;
	sulfateTestHclAdded?: boolean;
	sulfateTestBaCl2Added?: boolean;
	baseTested?: boolean;
	dried?: boolean;
	transferredToCrucible?: boolean;
	tekluCharred?: boolean;
	calcined?: boolean;
	cooled?: boolean;
	cuoMassG?: number;
	lastRecordedMassG?: number;
	reheatedAfterWeigh?: boolean;
	setupFilterPaperAttached?: boolean;
	setupReceiverAttached?: boolean;
	setupReceiverItemId?: string;
	setupReceiverName?: string;
	setupReceiverMaxVolumeMl?: number;
	setupReceiverContents?: ContainerContent[];
	setupReceiverFromFiltrate?: boolean;
	decisions?: Record<string, DecisionValue>;
	outcomes?: ContainerOutcomes;
}

export interface InventoryItem {
	itemId: string;
	baseItemId?: string;
	name: string;
	category: ItemCategory;
	quantity: number;
	weightGrams?: number;
	volumeMl?: number;
	maxVolumeMl?: number;
	contents?: ContainerContent[];
	labMeta?: LabContainerMeta;
}

export interface HeldItem {
	itemId: string;
	baseItemId?: string;
	name: string;
	category: ItemCategory;
	weightGrams?: number;
	volumeMl?: number;
	maxVolumeMl?: number;
	contents?: ContainerContent[];
	labMeta?: LabContainerMeta;
}

export interface LevelMilestone {
	step: number;
	title: string;
	completed: boolean;
	completedAt?: number;
	detail?: string;
}

export interface LevelState {
	levelId: string;
	title: string;
	xp: number;
	finished: boolean;
	milestones: LevelMilestone[];
	startedAt: number;
	updatedAt: number;
	lastEvent?: string;
}

export interface ReportIssue {
	code: string;
	impactMassG: number;
	decisionSummary: string;
}

export interface LevelReport {
	levelId: string;
	sampleMassG: number;
	cuoMassG: number;
	gravimetricFactor: number;
	kadarPercent: number;
	theoreticalPercent: number;
	deviationPercent: number;
	issues: ReportIssue[];
	decisions: Record<string, DecisionValue>;
	generatedAt: number;
}

export interface ConceptFeedback {
	code: string;
	title: string;
	why: string;
	correction: string;
	relatedConcept: string;
	blocking: boolean;
}

export interface PlayerState {
	id: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
	vx: number;
	vy: number;
	holding: HeldItem[];
}

export interface GameObjectState {
	id: string;
	objectType: GameObjectType;
	items: InventoryItem[];
}

export type ClientMessage =
	| { type: "move"; x: number; y: number; direction: Direction; vx: number; vy: number }
	| { type: "stop"; x: number; y: number; direction: Direction }
	| { type: "chat"; text: string }
	| { type: "take_item"; objectId: string; itemId: string }
	| { type: "place_item"; objectId: string; itemId: string }
	| { type: "use_held_on_item"; objectId: string; heldItemId: string; targetItemId: string }
	| { type: "weigh_item"; transferGrams: number }
	| { type: "scoop_sample" }
	| { type: "pour_item"; objectId: string; sourceItemId: string; targetItemId: string; transferMl: number }
	| { type: "dissolve_item"; objectId: string; sourceContainerItemId: string; targetContainerItemId: string }
	| { type: "combine_items"; objectId: string; itemIdA: string; itemIdB: string }
	| { type: "record_mass"; containerItemId: string; measuredMassG: number }
	| { type: "discard_object_contents"; objectId: string; itemId: string }
	| { type: "discard_held_contents"; itemId: string }
	| { type: "detach_setup_part"; objectId: string; setupItemId: string; part: "filter" | "receiver" | "all" }
	| { type: "reset_level" };

export type ServerMessage =
	| { type: "snapshot"; selfId: string; players: PlayerState[]; objects: GameObjectState[] }
	| { type: "player_join"; player: PlayerState }
	| { type: "player_leave"; playerId: string }
	| { type: "player_move"; playerId: string; x: number; y: number; direction: Direction; vx: number; vy: number }
	| { type: "player_stop"; playerId: string; x: number; y: number; direction: Direction }
	| { type: "error"; message: string }
	| { type: "concept_feedback"; feedback: ConceptFeedback }
	| { type: "chat"; playerId: string; playerName: string; text: string }
	| { type: "object_items_changed"; objectId: string; items: InventoryItem[] }
	| { type: "player_hold"; playerId: string; holding: HeldItem[] }
	| { type: "level_state"; level: LevelState }
	| { type: "level_report"; report: LevelReport };

export const ROOM_CONFIG = {
	MAX_PLAYERS: 20,
	MAP_WIDTH: 896,
	MAP_HEIGHT: 672,
	TILE_SIZE: 32,
	MAP_COLS: 28,
	MAP_ROWS: 21,
	PLAYER_SPEED: 120,
} as const;
