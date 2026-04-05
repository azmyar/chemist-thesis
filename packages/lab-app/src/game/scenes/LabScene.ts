import Phaser from "phaser";
import { gameClient } from "@/lib/network/client";
import type {
	PlayerState,
	ServerMessage,
	Direction,
	GameObjectState,
	GameObjectType,
} from "@/lib/protocol";
import { ROOM_CONFIG } from "@/lib/protocol";
import type { UIScene } from "./UIScene";

/** Camera zoom — sprites are 1:1 native, camera magnifies everything like Gather.town */
const CAMERA_ZOOM = 3;
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

	// ── Map ───────────────────────────────────────

	private buildGravimetriLab() {
		const { MAP_COLS, MAP_ROWS, TILE_SIZE } = ROOM_CONFIG;

		// Initialize collision grid — all walkable by default
		this.blocked = Array.from({ length: MAP_ROWS }, () =>
			Array(MAP_COLS).fill(false),
		);

		// Helper: convert tile coords to pixel center (world space, no scale)
		const tileX = (col: number) => col * TILE_SIZE + TILE_SIZE / 2;
		const tileY = (row: number) => row * TILE_SIZE + TILE_SIZE / 2;

		// ── Floor & Walls ──
		for (let row = 0; row < MAP_ROWS; row++) {
			for (let col = 0; col < MAP_COLS; col++) {
				const isWall =
					row === 0 ||
					row === MAP_ROWS - 1 ||
					col === 0 ||
					col === MAP_COLS - 1;
				this.add
					.sprite(
						tileX(col),
						tileY(row),
						isWall ? "tile-wall" : "tile-floor-lab",
					)
					.setDepth(0);

				if (isWall) {
					this.blocked[row][col] = true;
				}
			}
		}

		// ── Interactable Objects ──
		const invScale = 1 / CAMERA_ZOOM;
		const centerCol = Math.floor(MAP_COLS / 2);
		const centerRow = Math.floor(MAP_ROWS / 2);

		const objectDefs: {
			id: string;
			objectType: GameObjectType;
			texture: string;
			col: number;
			row: number;
		}[] = [
			{
				id: "workbench-1",
				objectType: "workbench",
				texture: "workbench",
				col: centerCol,
				row: centerRow - 2,
			},
			{
				id: "storage-1",
				objectType: "storage",
				texture: "storage",
				col: centerCol + 2,
				row: centerRow - 2,
			},
		];

		for (const def of objectDefs) {
			const ox = tileX(def.col);
			const oy = tileY(def.row);

			const sprite = this.add
				.sprite(ox, oy, def.texture)
				.setDepth(5);

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
		const centerX = Math.floor(MAP_COLS / 2) * TILE_SIZE + TILE_SIZE / 2;
		const centerY = Math.floor(MAP_ROWS / 2) * TILE_SIZE + TILE_SIZE / 2;

		this.localPlayer = this.add
			.sprite(centerX, centerY, "player", 0)
			.setDepth(10);

		this.localPlayer.play("player-idle-down");

		const invScale = 1 / CAMERA_ZOOM;
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

		this.cameras.main.setZoom(CAMERA_ZOOM);
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
					this.updateLocalHolding(msg.item);
					window.dispatchEvent(
						new CustomEvent("local-hold-changed", {
							detail: { item: msg.item },
						}),
					);
				} else {
					const remote = this.remotePlayers.get(msg.playerId);
					if (remote) {
						this.updateRemoteHolding(remote, msg.item);
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
		const invScale = 1 / CAMERA_ZOOM;

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

		if (state.holding) {
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

		const invScale = 1 / CAMERA_ZOOM;
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

		const invScale = 1 / CAMERA_ZOOM;
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

	private updateLocalHolding(item: string | null) {
		if (item) {
			this.holdingTag.setText(item).setVisible(true);
		} else {
			this.holdingTag.setVisible(false);
		}
	}

	private updateRemoteHolding(remote: RemotePlayerData, item: string | null) {
		if (item) {
			remote.holdingTag.setText(item).setVisible(true);
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
