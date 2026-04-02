export type Direction = "up" | "down" | "left" | "right";

export interface PlayerState {
	id: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
	vx: number;
	vy: number;
}

export type ClientMessage =
	| {
			type: "move";
			x: number;
			y: number;
			direction: Direction;
			vx: number;
			vy: number;
	  }
	| {
			type: "stop";
			x: number;
			y: number;
			direction: Direction;
	  }
	| {
			type: "signal";
			targetId: string;
			signal: RTCSignal;
	  };

export type RTCSignal =
	| { type: "offer"; sdp: string }
	| { type: "answer"; sdp: string }
	| { type: "ice-candidate"; candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };

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
	| { type: "error"; message: string }
	| {
			type: "signal";
			fromId: string;
			signal: RTCSignal;
	  };

export const ROOM_CONFIG = {
	MAX_PLAYERS: 20,
	MAP_WIDTH: 1024,
	MAP_HEIGHT: 768,
	TILE_SIZE: 32,
	MAP_COLS: 32,
	MAP_ROWS: 24,
	PLAYER_SPEED: 80,
} as const;
