import { z } from "zod";

// ── Direction ─────────────────────────────────────

export const directionSchema = z.enum(["up", "down", "left", "right"]);
export type Direction = z.infer<typeof directionSchema>;

// ── Item Categories & Measurement ─────────────────

export const itemCategorySchema = z.enum(["alat", "bahan"]);
export type ItemCategory = z.infer<typeof itemCategorySchema>;

/** What's been transferred into a container (e.g., weighed solid, poured liquid) */
export const containerContentSchema = z.object({
	itemId: z.string(),
	name: z.string(),
	weightGrams: z.number().optional(),
	volumeMl: z.number().optional(),
	dissolved: z.boolean().optional(),
});
export type ContainerContent = z.infer<typeof containerContentSchema>;

/**
 * Decision value stored per container. Flexible key-value so new step handlers
 * can log context-specific choices without schema migration.
 */
export const decisionValueSchema = z.union([z.string(), z.number(), z.boolean()]);
export type DecisionValue = z.infer<typeof decisionValueSchema>;

export const containerOutcomesSchema = z.object({
	issues: z.array(z.string()).optional(),
	massErrorG: z.number().optional(),
});
export type ContainerOutcomes = z.infer<typeof containerOutcomesSchema>;

export const labContainerMetaSchema = z.object({
	sampleTerusiG: z.number().optional(),
	acidified: z.boolean().optional(),
	boiled: z.boolean().optional(),
	precipitated: z.boolean().optional(),
	stirred: z.boolean().optional(),
	precipitationChecked: z.boolean().optional(),
	filtered: z.boolean().optional(),
	washed: z.boolean().optional(),
	fromFiltrate: z.boolean().optional(),
	sulfateTestHclAdded: z.boolean().optional(),
	sulfateTestBaCl2Added: z.boolean().optional(),
	baseTested: z.boolean().optional(),
	dried: z.boolean().optional(),
	transferredToCrucible: z.boolean().optional(),
	tekluCharred: z.boolean().optional(),
	calcined: z.boolean().optional(),
	cooled: z.boolean().optional(),
	cuoMassG: z.number().optional(),
	lastRecordedMassG: z.number().optional(),
	reheatedAfterWeigh: z.boolean().optional(),
	setupFilterPaperAttached: z.boolean().optional(),
	setupReceiverAttached: z.boolean().optional(),
	setupReceiverItemId: z.string().optional(),
	setupReceiverName: z.string().optional(),
	setupReceiverMaxVolumeMl: z.number().optional(),
	setupReceiverContents: z.array(containerContentSchema).optional(),
	setupReceiverFromFiltrate: z.boolean().optional(),

	// Open-world tracking: student decisions + derived outcomes.
	// Populated incrementally by step handlers; consumed by computeLevelReport.
	decisions: z.record(z.string(), decisionValueSchema).optional(),
	outcomes: containerOutcomesSchema.optional(),
});
export type LabContainerMeta = z.infer<typeof labContainerMetaSchema>;

// ── Inventory Items ───────────────────────────────

export const inventoryItemSchema = z.object({
	itemId: z.string(),
	baseItemId: z.string().optional(),
	name: z.string(),
	category: itemCategorySchema,
	quantity: z.number().int().min(0),

	// Bahan properties (solids have weightGrams, liquids have volumeMl)
	weightGrams: z.number().optional(),
	volumeMl: z.number().optional(),

	// Alat container properties
	maxVolumeMl: z.number().optional(),
	contents: z.array(containerContentSchema).optional(),
	labMeta: labContainerMetaSchema.optional(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// ── Held Item (what a player carries) ─────────────

export const heldItemSchema = z.object({
	itemId: z.string(),
	baseItemId: z.string().optional(),
	name: z.string(),
	category: itemCategorySchema,

	// Bahan measurement state
	weightGrams: z.number().optional(),
	volumeMl: z.number().optional(),

	// Container state (alat)
	maxVolumeMl: z.number().optional(),
	contents: z.array(containerContentSchema).optional(),
	labMeta: labContainerMetaSchema.optional(),
});
export type HeldItem = z.infer<typeof heldItemSchema>;

// ── Level / Milestone ────────────────────────────

export const levelMilestoneSchema = z.object({
	step: z.number().int().min(1),
	title: z.string(),
	completed: z.boolean(),
	completedAt: z.number().optional(),
	detail: z.string().optional(),
});
export type LevelMilestone = z.infer<typeof levelMilestoneSchema>;

export const levelStateSchema = z.object({
	levelId: z.string(),
	title: z.string(),
	xp: z.number().int().min(0),
	finished: z.boolean(),
	milestones: z.array(levelMilestoneSchema).length(14),
	startedAt: z.number(),
	updatedAt: z.number(),
	lastEvent: z.string().optional(),
});
export type LevelState = z.infer<typeof levelStateSchema>;

// ── Level Report (final summary shown after milestone 14) ────────

export const reportIssueSchema = z.object({
	code: z.string(),
	impactMassG: z.number(),
	decisionSummary: z.string(),
});
export type ReportIssue = z.infer<typeof reportIssueSchema>;

export const levelReportSchema = z.object({
	levelId: z.string(),
	sampleMassG: z.number(),
	cuoMassG: z.number(),
	gravimetricFactor: z.number(),
	kadarPercent: z.number(),
	theoreticalPercent: z.number(),
	deviationPercent: z.number(),
	issues: z.array(reportIssueSchema),
	decisions: z.record(z.string(), decisionValueSchema),
	generatedAt: z.number(),
});
export type LevelReport = z.infer<typeof levelReportSchema>;

// ── Immediate Concept Feedback ───────────────────

export interface ConceptFeedback {
	code: string;
	title: string;
	why: string;
	correction: string;
	relatedConcept: string;
	blocking: boolean;
}

// ── Player State ──────────────────────────────────

export const playerStateSchema = z.object({
	id: z.string(),
	name: z.string(),
	x: z.number(),
	y: z.number(),
	direction: directionSchema,
	vx: z.number(),
	vy: z.number(),
	holding: z.array(heldItemSchema).max(2),
});
export type PlayerState = z.infer<typeof playerStateSchema>;

// ── Game Object State ─────────────────────────────

export const gameObjectTypeSchema = z.enum([
	"workbench",
	"storage",
	"reagent_table",
	"timbangan",
	"oven",
	"furnace",
	"waste",
]);
export type GameObjectType = z.infer<typeof gameObjectTypeSchema>;

export const gameObjectStateSchema = z.object({
	id: z.string(),
	objectType: gameObjectTypeSchema,
	items: z.array(inventoryItemSchema),
});
export type GameObjectState = z.infer<typeof gameObjectStateSchema>;

// ── Constraint Rules ───────────────────────────────

// Transfer constraints are currently enforced in server runtime logic.
// Schema keeps item shapes generic to support flexible interactions.

// ── Client → Server Messages ──────────────────────

export const clientMoveSchema = z.object({
	type: z.literal("move"),
	x: z.number(),
	y: z.number(),
	direction: directionSchema,
	vx: z.number(),
	vy: z.number(),
});

export const clientStopSchema = z.object({
	type: z.literal("stop"),
	x: z.number(),
	y: z.number(),
	direction: directionSchema,
});

export const clientChatSchema = z.object({
	type: z.literal("chat"),
	text: z.string().min(1).max(200),
});

export const clientTakeItemSchema = z.object({
	type: z.literal("take_item"),
	objectId: z.string(),
	itemId: z.string(),
});

export const clientPlaceItemSchema = z.object({
	type: z.literal("place_item"),
	objectId: z.string(),
	itemId: z.string(),
});

export const clientUseHeldOnItemSchema = z.object({
	type: z.literal("use_held_on_item"),
	objectId: z.string(),
	heldItemId: z.string(),
	targetItemId: z.string(),
});

export const clientWeighItemSchema = z.object({
	type: z.literal("weigh_item"),
	transferGrams: z.number().positive(),
});

/**
 * Tap-to-scoop weighing. Unlike weigh_item, the client specifies no amount;
 * the server picks a small random transfer (mimics manual spatula scoop).
 * Intended for realistic sample weighing on a balance.
 */
export const clientScoopSampleSchema = z.object({
	type: z.literal("scoop_sample"),
});

export const clientPourItemSchema = z.object({
	type: z.literal("pour_item"),
	objectId: z.string(),
	sourceItemId: z.string(),
	targetItemId: z.string(),
	transferMl: z.number().positive(),
});

export const clientDissolveItemSchema = z.object({
	type: z.literal("dissolve_item"),
	objectId: z.string(),
	sourceContainerItemId: z.string(),
	targetContainerItemId: z.string(),
});

export const clientCombineItemsSchema = z.object({
	type: z.literal("combine_items"),
	objectId: z.string(),
	itemIdA: z.string(),
	itemIdB: z.string(),
});

export const clientRecordMassSchema = z.object({
	type: z.literal("record_mass"),
	containerItemId: z.string(),
	measuredMassG: z.number().positive(),
});

export const clientDiscardObjectContentsSchema = z.object({
	type: z.literal("discard_object_contents"),
	objectId: z.string(),
	itemId: z.string(),
});

export const clientDiscardHeldContentsSchema = z.object({
	type: z.literal("discard_held_contents"),
	itemId: z.string(),
});

export const setupDetachPartSchema = z.enum(["filter", "receiver", "all"]);
export type SetupDetachPart = z.infer<typeof setupDetachPartSchema>;

export const clientDetachSetupPartSchema = z.object({
	type: z.literal("detach_setup_part"),
	objectId: z.string(),
	setupItemId: z.string(),
	part: setupDetachPartSchema,
});

export const clientResetLevelSchema = z.object({
	type: z.literal("reset_level"),
});

export const clientMessageSchema = z.discriminatedUnion("type", [
	clientMoveSchema,
	clientStopSchema,
	clientChatSchema,
	clientTakeItemSchema,
	clientPlaceItemSchema,
	clientUseHeldOnItemSchema,
	clientWeighItemSchema,
	clientScoopSampleSchema,
	clientPourItemSchema,
	clientDissolveItemSchema,
	clientCombineItemsSchema,
	clientRecordMassSchema,
	clientDiscardObjectContentsSchema,
	clientDiscardHeldContentsSchema,
	clientDetachSetupPartSchema,
	clientResetLevelSchema,
]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;

// ── Server → Client Messages ──────────────────────

export type ServerMessage =
	| {
			type: "snapshot";
			selfId: string;
			players: PlayerState[];
			objects: GameObjectState[];
	  }
	| { type: "player_join"; player: PlayerState }
	| { type: "player_leave"; playerId: string }
	| {
			type: "player_move";
			playerId: string;
			x: number;
			y: number;
			direction: Direction;
			vx: number;
			vy: number;
	  }
	| {
			type: "player_stop";
			playerId: string;
			x: number;
			y: number;
			direction: Direction;
	  }
	| { type: "error"; message: string }
	| {
			type: "concept_feedback";
			feedback: ConceptFeedback;
	  }
	| { type: "chat"; playerId: string; playerName: string; text: string }
	| {
			type: "object_items_changed";
			objectId: string;
			items: InventoryItem[];
	  }
	| {
			type: "player_hold";
			playerId: string;
			holding: HeldItem[];
	  }
	| {
			type: "level_state";
			level: LevelState;
	  }
	| {
			type: "level_report";
			report: LevelReport;
	  };

// ── Room Config ───────────────────────────────────

export const ROOM_CONFIG = {
	MAX_PLAYERS: 20,
	MAP_WIDTH: 736,
	MAP_HEIGHT: 608,
	TILE_SIZE: 32,
	MAP_COLS: 23,
	MAP_ROWS: 19,
	PLAYER_SPEED: 120,
} as const;

// ── Join Room Schema ──────────────────────────────

export const joinRoomSchema = z.object({
	roomId: z.string().min(1).max(50),
});
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
