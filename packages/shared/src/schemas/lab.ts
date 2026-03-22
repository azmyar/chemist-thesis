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
});
export type PlayerState = z.infer<typeof playerStateSchema>;

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

export const clientMessageSchema = z.discriminatedUnion("type", [
	clientMoveSchema,
	clientStopSchema,
]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;

// ── Server → Client Messages ──────────────────────

export type ServerMessage =
	| {
			type: "snapshot";
			selfId: string;
			players: PlayerState[];
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
	| { type: "error"; message: string };

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
