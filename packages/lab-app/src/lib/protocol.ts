export type Direction = "up" | "down" | "left" | "right";

export interface PlayerState {
	id: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
	vx: number;
	vy: number;
	holding: string | null;
}

export type GameObjectType = "workbench" | "storage";

export interface InventoryItem {
	itemId: string;
	name: string;
	quantity: number;
}

export interface GameObjectState {
	id: string;
	objectType: GameObjectType;
	items: InventoryItem[];
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
			type: "chat";
			text: string;
	  }
	| {
			type: "take_item";
			objectId: string;
			itemId: string;
	  }
	| {
			type: "place_item";
			objectId: string;
	  };

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

export const ROOM_CONFIG = {
	MAX_PLAYERS: 20,
	MAP_WIDTH: 1024,
	MAP_HEIGHT: 768,
	TILE_SIZE: 32,
	MAP_COLS: 32,
	MAP_ROWS: 24,
	PLAYER_SPEED: 80,
} as const;
