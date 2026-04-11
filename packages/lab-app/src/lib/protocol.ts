export type Direction = "up" | "down" | "left" | "right";

export type ItemCategory = "alat" | "bahan";

export interface ContainerContent {
	itemId: string;
	name: string;
	weightGrams?: number;
	volumeMl?: number;
	dissolved?: boolean;
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

export type GameObjectType = "workbench" | "storage" | "reagent_table" | "timbangan" | "oven" | "furnace";

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
	| { type: "chat"; text: string }
	| { type: "take_item"; objectId: string; itemId: string }
	| { type: "place_item"; objectId: string; itemId: string }
	| { type: "weigh_item"; transferGrams: number }
	| {
			type: "pour_item";
			objectId: string;
			sourceItemId: string;
			targetItemId: string;
			transferMl: number;
	  }
	| {
			type: "dissolve_item";
			objectId: string;
			sourceContainerItemId: string;
			targetContainerItemId: string;
	  }
	| { type: "combine_items"; objectId: string; itemIdA: string; itemIdB: string }
	| {
			type: "record_mass";
			containerItemId: string;
			measuredMassG: number;
	  }
	| { type: "discard_object_contents"; objectId: string; itemId: string }
	| { type: "discard_held_contents"; itemId: string }
	| {
			type: "detach_setup_part";
			objectId: string;
			setupItemId: string;
			part: "filter" | "receiver" | "all";
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
			holding: HeldItem[];
	  }
	| {
			type: "level_state";
			level: LevelState;
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
