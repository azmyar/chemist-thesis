import { z } from "zod";

// ── Direction ─────────────────────────────────────

export const directionSchema = z.enum(["up", "down", "left", "right"]);
export type Direction = z.infer<typeof directionSchema>;

// ── Player State ──────────────────────────────────

export const playerStateSchema = z.object({
	id: z.string(),
	name: z.string(),
	x: z.number(),
	y: z.number(),
	direction: directionSchema,
	vx: z.number(),
	vy: z.number(),
	holding: z.string().nullable(),
});
export type PlayerState = z.infer<typeof playerStateSchema>;

// ── Game Object State ─────────────────────────────

export const gameObjectTypeSchema = z.enum(["workbench", "storage"]);
export type GameObjectType = z.infer<typeof gameObjectTypeSchema>;

export const inventoryItemSchema = z.object({
	itemId: z.string(),
	name: z.string(),
	quantity: z.number().int().min(0),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const gameObjectStateSchema = z.object({
	id: z.string(),
	objectType: gameObjectTypeSchema,
	items: z.array(inventoryItemSchema),
});
export type GameObjectState = z.infer<typeof gameObjectStateSchema>;

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
});

export const clientMessageSchema = z.discriminatedUnion("type", [
	clientMoveSchema,
	clientStopSchema,
	clientChatSchema,
	clientTakeItemSchema,
	clientPlaceItemSchema,
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
			item: string | null;
	  };

// ── Room Config ───────────────────────────────────

export const ROOM_CONFIG = {
	MAX_PLAYERS: 20,
	MAP_WIDTH: 1024, // 32 tiles * 32px
	MAP_HEIGHT: 768, // 24 tiles * 32px
	TILE_SIZE: 32,
	MAP_COLS: 32,
	MAP_ROWS: 24,
	PLAYER_SPEED: 80, // world px/s (camera zoom 3× → 240 screen px/s, same feel as before)
} as const;

// ── Join Room Schema ──────────────────────────────

export const joinRoomSchema = z.object({
	roomId: z.string().min(1).max(50),
});
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
