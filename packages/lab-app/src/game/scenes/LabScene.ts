import Phaser from "phaser";
import { gameClient } from "@/lib/network/client";
import type {
	PlayerState,
	ServerMessage,
	Direction,
	GameObjectType,
	HeldItem,
} from "@/lib/protocol";
import { ROOM_CONFIG } from "@/lib/protocol";
import type { UIScene } from "./UIScene";

/** Camera zoom — sprites are 1:1 native, camera magnifies everything like Gather.town */
const DESKTOP_CAMERA_ZOOM = 3;
const MOBILE_CAMERA_ZOOM = 2.35;
const PLAYER_SPEED = ROOM_CONFIG.PLAYER_SPEED;

interface ChatBubble {
	text: Phaser.GameObjects.Text;
	timer: Phaser.Time.TimerEvent;
}

interface RemotePlayerData {
	sprite: Phaser.GameObjects.Sprite;
	nameTag: Phaser.GameObjects.Text;
	holdingTag: Phaser.GameObjects.Text;
	chatBubble: ChatBubble | null;
	targetX: number;
	targetY: number;
	direction: Direction;
	isMoving: boolean;
}

/**
 * LabScene — main game scene.
 * Handles the tilemap, local player movement, remote player interpolation,
 * and network message synchronization.
 */
export class LabScene extends Phaser.Scene {
	// Local player
	private localPlayer!: Phaser.GameObjects.Sprite;
	private nameTag!: Phaser.GameObjects.Text;
	private holdingTag!: Phaser.GameObjects.Text;
	private localChatBubble: ChatBubble | null = null;
	private lastDirection: Direction = "down";
	private isMoving = false;
	private ready = false; // true after snapshot received

	// Remote players
	private remotePlayers: Map<string, RemotePlayerData> = new Map();

	// Input
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private wasd!: {
		W: Phaser.Input.Keyboard.Key;
		A: Phaser.Input.Keyboard.Key;
		S: Phaser.Input.Keyboard.Key;
		D: Phaser.Input.Keyboard.Key;
	};
	private joystickVx = 0;
	private joystickVy = 0;

	// Collision grid: true = blocked tile
	private blocked!: boolean[][];
	private cameraZoom = DESKTOP_CAMERA_ZOOM;

	// Interactable objects
	private interactables: {
		id: string;
		objectType: GameObjectType;
		x: number;
		y: number;
		sprite: Phaser.GameObjects.Sprite;
		label: Phaser.GameObjects.Text;
	}[] = [];
	private interactKey!: Phaser.Input.Keyboard.Key;
	private nearbyObjectId: string | null = null;

	// Network
	private unsubscribe: (() => void) | null = null;

	constructor() {
		super({ key: "LabScene" });
	}

	create() {
		this.cameraZoom = this.getResponsiveCameraZoom();
		this.buildGravimetriLab();
		this.createLocalPlayer();
		this.setupInput();
		this.setupNetwork();
	}

	update(_time: number, delta: number) {
		if (!this.ready) return;
		this.handleInput(delta);
		this.interpolateRemotePlayers(delta);
		this.checkProximity();
	}

	private getResponsiveCameraZoom() {
		if (typeof window === "undefined") return DESKTOP_CAMERA_ZOOM;

		const isCoarsePointer =
			window.matchMedia?.("(pointer: coarse)").matches ?? false;
		const isCompactViewport =
			window.matchMedia?.("(max-width: 700px), (max-height: 600px)").matches ??
			false;

		return isCoarsePointer || isCompactViewport
			? MOBILE_CAMERA_ZOOM
			: DESKTOP_CAMERA_ZOOM;
	}

	// ── Map ───────────────────────────────────────

	/**
	 * Build the gravimetri lab map — zoned layout matching the real SMAK lab
	 * denah: Ruang Timbang (left-top), Ruang Bahan Kimia (left-mid), Ruang
	 * Pengelola (left-bottom, cosmetic), Main Lab (center), Ruang Alat
	 * Kebersihan (right-top, cosmetic), Gudang (right-mid), Oven/Tanur area
	 * (right-bottom), plus a wastafel strip along the top wall.
	 *
	 * Interactable objects live in their chemistry-correct zones; cosmetic
	 * fixtures (wastafel, shower, whiteboard, papan tulis) are decor only.
	 */
	private buildGravimetriLab() {
		const { MAP_COLS, MAP_ROWS, TILE_SIZE } = ROOM_CONFIG;

		// Collision grid — all walkable by default, mutated by wall/object placement.
		this.blocked = Array.from({ length: MAP_ROWS }, () =>
			Array(MAP_COLS).fill(false),
		);

		const tileX = (col: number) => col * TILE_SIZE + TILE_SIZE / 2;
		const tileY = (row: number) => row * TILE_SIZE + TILE_SIZE / 2;
		const invScale = 1 / this.cameraZoom;

		const isInBounds = (col: number, row: number) =>
			col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS;

		const placeWallTile = (col: number, row: number) => {
			if (!isInBounds(col, row)) return;
			this.add.sprite(tileX(col), tileY(row), "tile-wall").setDepth(0);
			this.blocked[row][col] = true;
		};

		// ── Floor ──
		for (let row = 0; row < MAP_ROWS; row++) {
			for (let col = 0; col < MAP_COLS; col++) {
				this.add.sprite(tileX(col), tileY(row), "tile-floor-lab").setDepth(0);
			}
		}

		// ── Outer walls ──
		for (let col = 0; col < MAP_COLS; col++) {
			placeWallTile(col, 0);
			placeWallTile(col, MAP_ROWS - 1);
		}
		for (let row = 0; row < MAP_ROWS; row++) {
			placeWallTile(0, row);
			placeWallTile(MAP_COLS - 1, row);
		}

		// ── Interior walls (zone partitions) ──
		// Horizontal & vertical wall segments with door gaps (rows/cols listed
		// after exclusions become walkable).
		type WallSegment = { axis: "h" | "v"; fixed: number; from: number; to: number; doors: number[] };
		const segments: WallSegment[] = [
			// Left-column vertical partition separating left rooms from main area.
			{ axis: "v", fixed: 6, from: 1, to: MAP_ROWS - 2, doors: [8, 11, 16] },
			// Horizontal partition inside left column: between Ruang Timbang & Ruang Bahan Kimia.
			{ axis: "h", fixed: 10, from: 1, to: 5, doors: [] },
			// Horizontal partition inside left column: between Ruang Bahan Kimia & Ruang Pengelola.
			{ axis: "h", fixed: 14, from: 1, to: 5, doors: [] },
			// Ruang Kebersihan (top-right, 7×2 interior): left wall col 19, bottom wall row 3 with door at col 21.
			{ axis: "v", fixed: 19, from: 1, to: 3, doors: [] },
			{ axis: "h", fixed: 3, from: 20, to: 26, doors: [21] },
			// Gudang (7×2 interior), 4 tiles below Ruang Kebersihan.
			// Left wall col 19 rows 8-11 with door at row 9, top/bottom walls solid.
			{ axis: "v", fixed: 19, from: 8, to: 11, doors: [9] },
			{ axis: "h", fixed: 8, from: 20, to: 26, doors: [] },
			{ axis: "h", fixed: 11, from: 20, to: 26, doors: [] },
		];
		for (const seg of segments) {
			for (let i = seg.from; i <= seg.to; i++) {
				if (seg.doors.includes(i)) continue;
				if (seg.axis === "h") placeWallTile(i, seg.fixed);
				else placeWallTile(seg.fixed, i);
			}
		}

		// ── Zone labels ──
		// Rendered as small Phaser text pinned to the zone's top-left; non-
		// interactive, purely for orientation. Scaled down so camera zoom
		// doesn't stretch them unreadable.
		const labelZone = (text: string, col: number, row: number, color = "#495057") => {
			this.add
				.text(tileX(col), tileY(row) - 4, text, {
					fontSize: "10px",
					color,
					fontStyle: "bold",
					backgroundColor: "#ffffffdd",
					padding: { x: 3, y: 1 },
				})
				.setOrigin(0, 0.5)
				.setScale(invScale)
				.setDepth(1);
		};
		labelZone("Ruang Timbang", 1, 1);
		labelZone("Ruang Bahan Kimia", 1, 11);
		labelZone("Ruang Pengelola", 1, 15);
		labelZone("Ruang Kebersihan", 20, 1);
		labelZone("Gudang", 20, 9);
		labelZone("Meja Kerja (Laboratorium Utama)", 9, 1);

		// ── Cosmetic decor ──
		// Wastafel strip flush with the top outer wall (row 1).
		for (const col of [7, 10, 13, 16]) {
			this.add.sprite(tileX(col), tileY(1), "sink-station").setDepth(3);
			this.blocked[1][col] = true;
		}

		// Emergency shower inline with the wastafel strip at row 1, flush against
		// Ruang Kebersihan's left wall (col 18, rightmost spot in main lab row 1).
		this.add.sprite(tileX(18), tileY(1), "emergency-shower").setDepth(3);
		this.blocked[1][18] = true;

		// Teacher desk + whiteboard along the bottom of main lab (row 14, adjacent to outer wall).
		this.add.sprite(tileX(15), tileY(MAP_ROWS - 2), "teacher-desk").setDepth(3);
		this.blocked[MAP_ROWS - 2][15] = true;
		this.blocked[MAP_ROWS - 2][16] = true;
		this.add.sprite(tileX(19), tileY(MAP_ROWS - 2), "whiteboard").setDepth(3);
		this.blocked[MAP_ROWS - 2][19] = true;
		this.blocked[MAP_ROWS - 2][20] = true;

		// 4 pairs × 2 columns × 5 rows = 40 individual workbench tiles.
		// Top pairs rows 4-8, bottom pairs rows 12-16, corridor rows 9-11.
		// Column pairs: 10-11 and 16-17.
		// Aisles: col 9 (left outer), cols 12-15 (center), cols 18-22 (right).
		const BENCH_PAIRS: { colA: number; colB: number; rowStart: number; rowEnd: number }[] = [
			{ colA: 9, colB: 10, rowStart: 4, rowEnd: 8 },    // top-left
			{ colA: 15, colB: 16, rowStart: 4, rowEnd: 8 },   // top-right
			{ colA: 9, colB: 10, rowStart: 13, rowEnd: 17 },  // bottom-left
			{ colA: 17, colB: 18, rowStart: 13, rowEnd: 17 }, // bottom-right
		];

		let wbIdx = 1;
		for (const { colA, colB, rowStart, rowEnd } of BENCH_PAIRS) {
			for (const col of [colA, colB]) {
				for (let row = rowStart; row <= rowEnd; row++) {
					const wbId = `workbench-${wbIdx++}`;
					const ox = tileX(col);
					const oy = tileY(row);
					const sprite = this.add.sprite(ox, oy, "workbench").setDepth(5);
					const label = this.add
						.text(ox, oy - 20, "[E]", {
							fontSize: "11px",
							color: "#ffd43b",
							backgroundColor: "#00000099",
							padding: { x: 3, y: 1 },
						})
						.setOrigin(0.5, 1)
						.setScale(invScale)
						.setDepth(15)
						.setVisible(false);
					this.interactables.push({ id: wbId, objectType: "workbench", x: ox, y: oy, sprite, label });
					this.blocked[row][col] = true;
				}
			}
		}

		// Meja tengah — cosmetic center island between the two bottom bench pairs.
		// Non-interactable; blocks movement but does not register as a workbench.
		// Uses the dark-wood "meja-tengah" texture to visually distinguish it
		// from the white workbenches.
		for (const col of [13, 14]) {
			for (let row = 13; row <= 17; row++) {
				this.add.sprite(tileX(col), tileY(row), "meja-tengah").setDepth(5);
				this.blocked[row][col] = true;
			}
		}

		// Table placeholders along the top (row 12) and right (col 26) edges of
		// the empty space below Gudang. Cosmetic L-shape, non-interactable.
		for (let col = 20; col <= 26; col++) {
			this.add.sprite(tileX(col), tileY(12), "meja-tengah").setDepth(5);
			this.blocked[12][col] = true;
		}
		for (let row = 13; row <= MAP_ROWS - 2; row++) {
			this.add.sprite(tileX(26), tileY(row), "meja-tengah").setDepth(5);
			this.blocked[row][26] = true;
		}

		// Gap between Ruang Kebersihan (row 3) and Gudang (row 8) — cols 20-26
		// rows 4-7. Right column (col 26) is occupied by 2 ruang asam (fume
		// hoods). The alat rack (storage-1) is split visually into a top 1×4
		// strip (row 4 cols 22-25) and a bottom 1×6 strip (row 7 cols 20-25),
		// but every tile shares the single storage-1 state — grabbing from
		// any tile draws from the same inventory. Col 20 row 4 stays as a
		// cosmetic placeholder (meja-tengah) since the top rack is 1×4.
		this.add.sprite(tileX(20), tileY(4), "meja-tengah").setDepth(5);
		this.blocked[4][20] = true;

		const RACK_TILES: { col: number; row: number }[] = [
			// Top rack: 1×4 at row 4, cols 22-25.
			{ col: 22, row: 4 },
			{ col: 23, row: 4 },
			{ col: 24, row: 4 },
			{ col: 25, row: 4 },
			// Bottom rack: 1×6 at row 7, cols 20-25.
			{ col: 20, row: 7 },
			{ col: 21, row: 7 },
			{ col: 22, row: 7 },
			{ col: 23, row: 7 },
			{ col: 24, row: 7 },
			{ col: 25, row: 7 },
		];
		for (const { col, row } of RACK_TILES) {
			const ox = tileX(col);
			const oy = tileY(row);
			const sprite = this.add.sprite(ox, oy, "storage").setDepth(5);
			const label = this.add
				.text(ox, oy - 20, "[E]", {
					fontSize: "11px",
					color: "#ffd43b",
					backgroundColor: "#00000099",
					padding: { x: 3, y: 1 },
				})
				.setOrigin(0.5, 1)
				.setScale(invScale)
				.setDepth(15)
				.setVisible(false);
			this.interactables.push({
				id: "storage-1",
				objectType: "storage",
				x: ox,
				y: oy,
				sprite,
				label,
			});
			this.blocked[row][col] = true;
		}
		// 2 ruang asam on col 26: top covers rows 4-5, bottom covers rows 6-7.
		const asamTopY = (tileY(4) + tileY(5)) / 2;
		this.add
			.sprite(tileX(26), asamTopY, "fume-hood")
			.setDepth(5)
			.setDisplaySize(TILE_SIZE, TILE_SIZE * 2);
		this.blocked[4][26] = true;
		this.blocked[5][26] = true;
		const asamBottomY = (tileY(6) + tileY(7)) / 2;
		this.add
			.sprite(tileX(26), asamBottomY, "fume-hood")
			.setDepth(5)
			.setDisplaySize(TILE_SIZE, TILE_SIZE * 2);
		this.blocked[6][26] = true;
		this.blocked[7][26] = true;

		// Interior accents in Ruang Pengelola (admin room) — a desk anchored to bottom.
		this.add.sprite(tileX(3), tileY(MAP_ROWS - 2), "teacher-desk").setDepth(3);
		this.blocked[MAP_ROWS - 2][3] = true;
		this.blocked[MAP_ROWS - 2][4] = true;

		// ── Interactable Objects (placed in chemistry-correct zones) ──
		const objectDefs: {
			id: string;
			objectType: GameObjectType;
			texture: string;
			col: number;
			row: number;
		}[] = [
			// Ruang Timbang — 6 analytical balances in an L-shape hugging the
			// top wall (row 1) and left wall (col 1), with 2-tile spacing.
			{ id: "timbangan-1", objectType: "timbangan", texture: "timbangan", col: 1, row: 1 },
			{ id: "timbangan-2", objectType: "timbangan", texture: "timbangan", col: 3, row: 1 },
			{ id: "timbangan-3", objectType: "timbangan", texture: "timbangan", col: 5, row: 1 },
			{ id: "timbangan-4", objectType: "timbangan", texture: "timbangan", col: 1, row: 3 },
			{ id: "timbangan-5", objectType: "timbangan", texture: "timbangan", col: 1, row: 5 },
			{ id: "timbangan-6", objectType: "timbangan", texture: "timbangan", col: 1, row: 7 },
			// Ruang Bahan Kimia — reagent storage, anchored to bottom row of Bahan Kimia rows 11-13.
			{ id: "reagent-table-1", objectType: "reagent_table", texture: "reagent-table", col: 3, row: 13 },
			// Equipment on top of the right placeholder tables (col 26) below Gudang.
			// Order top-to-bottom: oven (r13), gap (r14), oven (r15), gap (r16), tanur (r17).
			{ id: "oven-1", objectType: "oven", texture: "oven", col: 26, row: 13 },
			{ id: "oven-2", objectType: "oven", texture: "oven", col: 26, row: 15 },
			{ id: "furnace-1", objectType: "furnace", texture: "furnace", col: 26, row: 17 },
		];

		for (const def of objectDefs) {
			const ox = tileX(def.col);
			const oy = tileY(def.row);

			const sprite = this.add.sprite(ox, oy, def.texture).setDepth(5);

			const label = this.add
				.text(ox, oy - 20, "[E]", {
					fontSize: "11px",
					color: "#ffd43b",
					backgroundColor: "#00000099",
					padding: { x: 3, y: 1 },
				})
				.setOrigin(0.5, 1)
				.setScale(invScale)
				.setDepth(15)
				.setVisible(false);

			this.interactables.push({
				id: def.id,
				objectType: def.objectType,
				x: ox,
				y: oy,
				sprite,
				label,
			});

			this.blocked[def.row][def.col] = true;
		}

		// Dev grid overlay — col numbers along the top wall (row 0) and row
		// numbers along the left wall (col 0). Toggle DEV_GRID to hide.
		const DEV_GRID = true;
		if (DEV_GRID) {
			for (let col = 0; col < MAP_COLS; col++) {
				this.add
					.text(tileX(col), tileY(0), String(col), {
						fontSize: "10px",
						color: "#ffffff",
						backgroundColor: "#dc354588",
						padding: { x: 2, y: 0 },
					})
					.setOrigin(0.5, 0.5)
					.setScale(invScale)
					.setDepth(100);
			}
			for (let row = 0; row < MAP_ROWS; row++) {
				this.add
					.text(tileX(0), tileY(row), String(row), {
						fontSize: "10px",
						color: "#ffffff",
						backgroundColor: "#dc354588",
						padding: { x: 2, y: 0 },
					})
					.setOrigin(0.5, 0.5)
					.setScale(invScale)
					.setDepth(100);
			}
		}
	}

	/** Check if a world-space pixel position collides with a blocked tile */
	private isBlocked(px: number, py: number): boolean {
		const { TILE_SIZE, MAP_COLS, MAP_ROWS } = ROOM_CONFIG;

		// Small hitbox radius around player center (in world pixels)
		const r = 10;
		const corners = [
			{ x: px - r, y: py - r },
			{ x: px + r, y: py - r },
			{ x: px - r, y: py + r },
			{ x: px + r, y: py + r },
		];

		for (const pt of corners) {
			const col = Math.floor(pt.x / TILE_SIZE);
			const row = Math.floor(pt.y / TILE_SIZE);
			if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS)
				return true;
			if (this.blocked[row][col]) return true;
		}
		return false;
	}

	// ── Local Player ──────────────────────────────

	private createLocalPlayer() {
		const { MAP_COLS, MAP_ROWS, TILE_SIZE } = ROOM_CONFIG;
		// Initial render position matches server spawn: col 13, row 18 (bottom corridor, main lab).
		// Real position is overwritten immediately on snapshot receipt.
		const centerX = 13 * TILE_SIZE + TILE_SIZE / 2;
		const centerY = 18 * TILE_SIZE + TILE_SIZE / 2;

		this.localPlayer = this.add
			.sprite(centerX, centerY, "player", 0)
			.setDepth(10);

		this.localPlayer.play("player-idle-down");

		const invScale = 1 / this.cameraZoom;
		this.nameTag = this.add
			.text(centerX, centerY - 20, "Kamu", {
				fontSize: "14px",
				color: "#f8f9fa",
				backgroundColor: "#00000088",
				padding: { x: 4, y: 2 },
			})
			.setOrigin(0.5, 1)
			.setScale(invScale)
			.setDepth(11);

		this.holdingTag = this.add
			.text(centerX, centerY + 14, "", {
				fontSize: "10px",
				color: "#ffd43b",
				backgroundColor: "#00000099",
				padding: { x: 3, y: 1 },
			})
			.setOrigin(0.5, 0)
			.setScale(invScale)
			.setDepth(11)
			.setVisible(false);

		this.cameras.main.setZoom(this.cameraZoom);
		this.cameras.main.startFollow(this.localPlayer, true, 0.08, 0.08);
		this.cameras.main.setBounds(
			0,
			0,
			MAP_COLS * TILE_SIZE,
			MAP_ROWS * TILE_SIZE,
		);
		this.cameras.main.setRoundPixels(true);
	}

	// ── Input ─────────────────────────────────────

	private setupInput() {
		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
			this.wasd = {
				W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
				A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
				S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
				D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
			};
			this.interactKey = this.input.keyboard.addKey(
				Phaser.Input.Keyboard.KeyCodes.E,
			);
		}

		// Listen for virtual joystick events from React component
		const onJoystickMove = ((e: CustomEvent) => {
			this.joystickVx = e.detail.vx;
			this.joystickVy = e.detail.vy;
		}) as EventListener;

		const onJoystickStop = () => {
			this.joystickVx = 0;
			this.joystickVy = 0;
		};

		// Mobile interact button event
		const onMobileInteract = () => {
			if (this.nearbyObjectId) {
				const obj = this.interactables.find(
					(o) => o.id === this.nearbyObjectId,
				);
				if (obj) this.triggerInteract(obj);
			}
		};

		window.addEventListener("joystick-move", onJoystickMove);
		window.addEventListener("joystick-stop", onJoystickStop);
		window.addEventListener("mobile-interact", onMobileInteract);

		this.events.on("shutdown", () => {
			window.removeEventListener("joystick-move", onJoystickMove);
			window.removeEventListener("joystick-stop", onJoystickStop);
			window.removeEventListener("mobile-interact", onMobileInteract);
		});
	}

	private handleInput(delta: number) {
		let vx = 0;
		let vy = 0;

		// Keyboard input
		if (this.cursors) {
			if (this.cursors.left.isDown || this.wasd?.A.isDown) vx -= 1;
			if (this.cursors.right.isDown || this.wasd?.D.isDown) vx += 1;
			if (this.cursors.up.isDown || this.wasd?.W.isDown) vy -= 1;
			if (this.cursors.down.isDown || this.wasd?.S.isDown) vy += 1;
		}

		// Virtual joystick override
		if (this.joystickVx !== 0 || this.joystickVy !== 0) {
			vx = this.joystickVx;
			vy = this.joystickVy;
		}

		// Normalize diagonal movement
		if (vx !== 0 && vy !== 0) {
			const len = Math.sqrt(vx * vx + vy * vy);
			vx /= len;
			vy /= len;
		}

		const moving = vx !== 0 || vy !== 0;

		if (moving) {
			const dx = vx * PLAYER_SPEED * (delta / 1000);
			const dy = vy * PLAYER_SPEED * (delta / 1000);

			const curX = this.localPlayer.x;
			const curY = this.localPlayer.y;

			let newX = curX + dx;
			let newY = curY + dy;

			if (this.isBlocked(newX, curY)) {
				newX = curX;
			}
			if (this.isBlocked(newX, newY)) {
				newY = curY;
			}

			this.localPlayer.setPosition(newX, newY);
			this.nameTag.setPosition(newX, newY - 20);
			this.holdingTag.setPosition(newX, newY + 14);
			if (this.localChatBubble) {
				this.localChatBubble.text.setPosition(newX, newY - 28);
			}

			let direction: Direction = this.lastDirection;
			if (Math.abs(vx) > Math.abs(vy)) {
				direction = vx > 0 ? "right" : "left";
			} else {
				direction = vy > 0 ? "down" : "up";
			}
			this.lastDirection = direction;

			const walkKey = `player-walk-${direction}`;
			if (this.localPlayer.anims.currentAnim?.key !== walkKey) {
				this.localPlayer.play(walkKey, true);
			}

			gameClient.send({
				type: "move",
				x: newX,
				y: newY,
				direction,
				vx: vx * PLAYER_SPEED,
				vy: vy * PLAYER_SPEED,
			});

			this.isMoving = true;
		} else if (this.isMoving) {
			this.isMoving = false;
			this.localPlayer.play(`player-idle-${this.lastDirection}`);

			gameClient.send({
				type: "stop",
				x: this.localPlayer.x,
				y: this.localPlayer.y,
				direction: this.lastDirection,
			});
		}
	}

	// ── Network ───────────────────────────────────

	private setupNetwork() {
		this.unsubscribe = gameClient.onMessage((msg) =>
			this.handleServerMessage(msg),
		);

		this.events.on("shutdown", () => {
			this.unsubscribe?.();
		});
	}

	private handleServerMessage(msg: ServerMessage) {
		switch (msg.type) {
			case "snapshot": {
				for (const [, remote] of this.remotePlayers) {
					remote.sprite.destroy();
					remote.nameTag.destroy();
				}
				this.remotePlayers.clear();

				for (const p of msg.players) {
					if (p.id === msg.selfId) {
						this.localPlayer.setPosition(p.x, p.y);
						this.lastDirection = p.direction;
						this.localPlayer.play(`player-idle-${p.direction}`);
						this.nameTag
							.setText(p.name)
							.setPosition(p.x, p.y - 20);
						this.holdingTag.setPosition(p.x, p.y + 14);
						this.updateLocalHolding(p.holding);
						window.dispatchEvent(
							new CustomEvent("local-hold-changed", {
								detail: { holding: p.holding },
							}),
						);
						// Snap camera to player immediately (no lerp delay)
						this.cameras.main.centerOn(p.x, p.y);
						continue;
					}
					this.addRemotePlayer(p);
				}

				// Sync object states to React
				for (const obj of msg.objects) {
					window.dispatchEvent(
						new CustomEvent("object-items-changed", {
							detail: {
								objectId: obj.id,
								items: obj.items,
							},
						}),
					);
				}

				this.ready = true;
				this.updatePlayerCount();
				break;
			}
			case "player_join": {
				this.addRemotePlayer(msg.player);
				this.updatePlayerCount();
				break;
			}
			case "player_leave": {
				this.removeRemotePlayer(msg.playerId);
				this.updatePlayerCount();
				break;
			}
			case "player_move": {
				const remote = this.remotePlayers.get(msg.playerId);
				if (remote) {
					remote.targetX = msg.x;
					remote.targetY = msg.y;
					remote.direction = msg.direction;
					remote.isMoving = true;

					const walkKey = `remote-player-walk-${msg.direction}`;
					if (remote.sprite.anims.currentAnim?.key !== walkKey) {
						remote.sprite.play(walkKey, true);
					}
				}
				break;
			}
			case "player_stop": {
				const remote = this.remotePlayers.get(msg.playerId);
				if (remote) {
					remote.targetX = msg.x;
					remote.targetY = msg.y;
					remote.direction = msg.direction;
					remote.isMoving = false;

					remote.sprite.play(
						`remote-player-idle-${msg.direction}`,
					);
				}
				break;
			}
			case "chat": {
				if (msg.playerId === gameClient.selfId) {
					this.showLocalChatBubble(msg.text);
				} else {
					const remote = this.remotePlayers.get(msg.playerId);
					if (remote) {
						this.showRemoteChatBubble(remote, msg.text);
					}
				}
				break;
			}
			case "player_hold": {
				if (msg.playerId === gameClient.selfId) {
					this.updateLocalHolding(msg.holding);
					window.dispatchEvent(
						new CustomEvent("local-hold-changed", {
							detail: { holding: msg.holding },
						}),
					);
				} else {
					const remote = this.remotePlayers.get(msg.playerId);
					if (remote) {
						this.updateRemoteHolding(remote, msg.holding);
					}
				}
				break;
			}
			case "object_items_changed": {
				window.dispatchEvent(
					new CustomEvent("object-items-changed", {
						detail: {
							objectId: msg.objectId,
							items: msg.items,
						},
					}),
				);
				break;
			}
			case "level_state": {
				window.dispatchEvent(
					new CustomEvent("level-state", {
						detail: msg.level,
					}),
				);
				break;
			}
			case "level_report": {
				window.dispatchEvent(
					new CustomEvent("level-report", {
						detail: msg.report,
					}),
				);
				break;
			}
			case "concept_feedback": {
				window.dispatchEvent(
					new CustomEvent("concept-feedback", {
						detail: msg.feedback,
					}),
				);
				break;
			}
			case "error": {
				console.warn("[Server]", msg.message);
				break;
			}
		}
	}

	// ── Remote Players ────────────────────────────

	private addRemotePlayer(state: PlayerState) {
		if (this.remotePlayers.has(state.id)) return;

		const x = state.x;
		const y = state.y;
		const invScale = 1 / this.cameraZoom;

		const sprite = this.add
			.sprite(x, y, "remote-player", 0)
			.setDepth(10);

		const moving = state.vx !== 0 || state.vy !== 0;
		const animKey = moving
			? `remote-player-walk-${state.direction}`
			: `remote-player-idle-${state.direction}`;
		sprite.play(animKey);

		const nameTag = this.add
			.text(x, y - 20, state.name, {
				fontSize: "14px",
				color: "#b3e0f7",
				backgroundColor: "#00000088",
				padding: { x: 4, y: 2 },
			})
			.setOrigin(0.5, 1)
			.setScale(invScale)
			.setDepth(11);

		const holdingTag = this.add
			.text(x, y + 14, "", {
				fontSize: "10px",
				color: "#ffd43b",
				backgroundColor: "#00000099",
				padding: { x: 3, y: 1 },
			})
			.setOrigin(0.5, 0)
			.setScale(invScale)
			.setDepth(11)
			.setVisible(false);

		const remoteData: RemotePlayerData = {
			sprite,
			nameTag,
			holdingTag,
			chatBubble: null,
			targetX: x,
			targetY: y,
			direction: state.direction,
			isMoving: moving,
		};

		if (state.holding.length > 0) {
			this.updateRemoteHolding(remoteData, state.holding);
		}

		this.remotePlayers.set(state.id, remoteData);
	}

	private removeRemotePlayer(playerId: string) {
		const remote = this.remotePlayers.get(playerId);
		if (remote) {
			remote.sprite.destroy();
			remote.nameTag.destroy();
			remote.holdingTag.destroy();
			if (remote.chatBubble) {
				remote.chatBubble.timer.destroy();
				remote.chatBubble.text.destroy();
			}
			this.remotePlayers.delete(playerId);
		}
	}

	private interpolateRemotePlayers(delta: number) {
		const lerpFactor = Math.min(1, (delta / 1000) * 10);

		for (const [, remote] of this.remotePlayers) {
			const dx = remote.targetX - remote.sprite.x;
			const dy = remote.targetY - remote.sprite.y;

			if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
				remote.sprite.x += dx * lerpFactor;
				remote.sprite.y += dy * lerpFactor;
			} else {
				remote.sprite.setPosition(remote.targetX, remote.targetY);
			}

			remote.nameTag.setPosition(
				remote.sprite.x,
				remote.sprite.y - 20,
			);
			remote.holdingTag.setPosition(
				remote.sprite.x,
				remote.sprite.y + 14,
			);
			if (remote.chatBubble) {
				remote.chatBubble.text.setPosition(
					remote.sprite.x,
					remote.sprite.y - 28,
				);
			}
		}
	}

	// ── Chat Bubbles ─────────────────────────────

	private showLocalChatBubble(text: string) {
		if (this.localChatBubble) {
			this.localChatBubble.timer.destroy();
			this.localChatBubble.text.destroy();
		}

		const invScale = 1 / this.cameraZoom;
		const bubble = this.add
			.text(this.localPlayer.x, this.localPlayer.y - 28, text, {
				fontSize: "12px",
				color: "#ffffff",
				backgroundColor: "#1e293bdd",
				padding: { x: 6, y: 3 },
				wordWrap: { width: 150 },
				align: "center",
			})
			.setOrigin(0.5, 1)
			.setScale(invScale)
			.setDepth(20);

		const timer = this.time.delayedCall(4000, () => {
			bubble.destroy();
			this.localChatBubble = null;
		});

		this.localChatBubble = { text: bubble, timer };
	}

	private showRemoteChatBubble(remote: RemotePlayerData, text: string) {
		if (remote.chatBubble) {
			remote.chatBubble.timer.destroy();
			remote.chatBubble.text.destroy();
		}

		const invScale = 1 / this.cameraZoom;
		const bubble = this.add
			.text(remote.sprite.x, remote.sprite.y - 28, text, {
				fontSize: "12px",
				color: "#ffffff",
				backgroundColor: "#1e293bdd",
				padding: { x: 6, y: 3 },
				wordWrap: { width: 150 },
				align: "center",
			})
			.setOrigin(0.5, 1)
			.setScale(invScale)
			.setDepth(20);

		const timer = this.time.delayedCall(4000, () => {
			bubble.destroy();
			remote.chatBubble = null;
		});

		remote.chatBubble = { text: bubble, timer };
	}

	// ── Holding State ────────────────────────────

	private updateLocalHolding(holding: HeldItem[]) {
		if (holding.length > 0) {
			const names = holding.map((h) => h.name).join(", ");
			this.holdingTag.setText(names).setVisible(true);
		} else {
			this.holdingTag.setVisible(false);
		}
	}

	private updateRemoteHolding(remote: RemotePlayerData, holding: HeldItem[]) {
		if (holding.length > 0) {
			const names = holding.map((h) => h.name).join(", ");
			remote.holdingTag.setText(names).setVisible(true);
		} else {
			remote.holdingTag.setVisible(false);
		}
	}

	// ── Interaction ──────────────────────────────

	private checkProximity() {
		const px = this.localPlayer.x;
		const py = this.localPlayer.y;
		const INTERACT_DIST = 40; // world pixels

		let nearest: (typeof this.interactables)[number] | null = null;
		let nearestDist = Infinity;

		for (const obj of this.interactables) {
			const dist = Math.hypot(obj.x - px, obj.y - py);
			if (dist < INTERACT_DIST && dist < nearestDist) {
				nearest = obj;
				nearestDist = dist;
			}
		}

		// Show/hide labels
		for (const obj of this.interactables) {
			obj.label.setVisible(obj === nearest);
		}

		const prevNearby = this.nearbyObjectId;
		this.nearbyObjectId = nearest?.id ?? null;

		// Notify React when nearby object changes (for mobile button)
		if (this.nearbyObjectId !== prevNearby) {
			window.dispatchEvent(
				new CustomEvent("nearby-object-changed", {
					detail: nearest
						? {
								objectId: nearest.id,
								objectType: nearest.objectType,
							}
						: null,
				}),
			);
		}

		// Handle E key press (desktop)
		if (
			nearest &&
			this.interactKey &&
			Phaser.Input.Keyboard.JustDown(this.interactKey)
		) {
			this.triggerInteract(nearest);
		}
	}

	private triggerInteract(obj: (typeof this.interactables)[number]) {
		window.dispatchEvent(
			new CustomEvent("object-interact", {
				detail: {
					objectId: obj.id,
					objectType: obj.objectType,
				},
			}),
		);
	}

	// ── Helpers ───────────────────────────────────

	private updatePlayerCount() {
		const count = this.remotePlayers.size + 1;
		const uiScene = this.scene.get("UIScene") as UIScene;
		if (uiScene?.updatePlayerCount) {
			uiScene.updatePlayerCount(count);
		}
	}
}
