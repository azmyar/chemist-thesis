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

export const clientWeighItemSchema = z.object({
	type: z.literal("weigh_item"),
	transferGrams: z.number().positive(),
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

export const clientMessageSchema = z.discriminatedUnion("type", [
	clientMoveSchema,
	clientStopSchema,
	clientChatSchema,
	clientTakeItemSchema,
	clientPlaceItemSchema,
	clientWeighItemSchema,
	clientPourItemSchema,
	clientDissolveItemSchema,
	clientCombineItemsSchema,
	clientRecordMassSchema,
	clientDiscardObjectContentsSchema,
	clientDiscardHeldContentsSchema,
	clientDetachSetupPartSchema,
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
	  };

// ── Room Config ───────────────────────────────────

export const ROOM_CONFIG = {
	MAX_PLAYERS: 20,
	MAP_WIDTH: 1024,
	MAP_HEIGHT: 768,
	TILE_SIZE: 32,
	MAP_COLS: 32,
	MAP_ROWS: 24,
	PLAYER_SPEED: 80,
} as const;

// ── Join Room Schema ──────────────────────────────

export const joinRoomSchema = z.object({
	roomId: z.string().min(1).max(50),
});
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
