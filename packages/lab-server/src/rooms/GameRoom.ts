import { DurableObject } from "cloudflare:workers";
import {
	type ClientMessage,
	type Direction,
	type PlayerState,
	type ServerMessage,
	ROOM_CONFIG,
	clientMessageSchema,
} from "@chemist/shared";

interface PlayerConnection {
	ws: WebSocket;
	state: PlayerState;
}

interface PlayerSocketAttachment {
	playerState: PlayerState;
}

export class GameRoom extends DurableObject {
	private players: Map<string, PlayerConnection> = new Map();

	constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
		super(ctx, env);
		this.rehydratePlayers();
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname !== "/ws") {
			return new Response("Not found", { status: 404 });
		}

		const upgradeHeader = request.headers.get("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return new Response("Expected WebSocket upgrade", { status: 426 });
		}

		const randomSuffix = Math.random().toString(36).slice(2, 6);
		const nameFromQuery = url.searchParams.get("name")?.trim();
		const user = {
			id: `guest-${randomSuffix}`,
			name: nameFromQuery
				? nameFromQuery.slice(0, 24)
				: `Pemain ${randomSuffix}`,
		};

		if (this.players.size >= ROOM_CONFIG.MAX_PLAYERS) {
			return new Response("Ruangan penuh", { status: 503 });
		}

		const pair = new WebSocketPair();
		const [client, server] = [pair[0], pair[1]];
		this.ctx.acceptWebSocket(server);

		const ts = ROOM_CONFIG.TILE_SIZE;
		const spawnCenterX =
			Math.floor(ROOM_CONFIG.MAP_COLS / 2) * ts + ts / 2;
		const spawnCenterY =
			Math.floor(ROOM_CONFIG.MAP_ROWS / 2) * ts + ts / 2;
		const spawnOffsetX = (Math.random() - 0.5) * ts * 0.5;
		const spawnOffsetY = (Math.random() - 0.5) * ts * 0.5;
		const playerState: PlayerState = {
			id: user.id,
			name: user.name,
			x: spawnCenterX + spawnOffsetX,
			y: spawnCenterY + spawnOffsetY,
			direction: "down" as Direction,
			vx: 0,
			vy: 0,
		};

		this.players.set(user.id, {
			ws: server,
			state: playerState,
		});

		this.persistPlayerState(server, playerState);

		const snapshot: ServerMessage = {
			type: "snapshot",
			selfId: user.id,
			players: Array.from(this.players.values()).map((p) => p.state),
		};
		server.send(JSON.stringify(snapshot));

		this.broadcast({ type: "player_join", player: playerState }, user.id);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(
		ws: WebSocket,
		message: string | ArrayBuffer,
	): Promise<void> {
		const attachment = ws.deserializeAttachment() as {
			playerState: PlayerState;
		} | null;
		if (!attachment) return;

		const player = this.players.get(attachment.playerState.id);
		if (!player) return;

		try {
			const raw =
				typeof message === "string"
					? message
					: new TextDecoder().decode(message);
			const parsed = clientMessageSchema.parse(JSON.parse(raw));
			this.handleClientMessage(attachment.playerState.id, player, parsed);
		} catch {
			ws.send(
				JSON.stringify({
					type: "error",
					message: "Pesan tidak valid",
				} satisfies ServerMessage),
			);
		}
	}

	async webSocketClose(
		ws: WebSocket,
		_code: number,
		_reason: string,
	): Promise<void> {
		const attachment = ws.deserializeAttachment() as {
			playerState: PlayerState;
		} | null;
		if (!attachment) return;

		this.players.delete(attachment.playerState.id);
		this.broadcast({
			type: "player_leave",
			playerId: attachment.playerState.id,
		});
	}

	async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
		const attachment = ws.deserializeAttachment() as {
			playerState: PlayerState;
		} | null;
		if (!attachment) return;

		this.players.delete(attachment.playerState.id);
		this.broadcast({
			type: "player_leave",
			playerId: attachment.playerState.id,
		});
	}

	private handleClientMessage(
		playerId: string,
		player: PlayerConnection,
		msg: ClientMessage,
	): void {
		switch (msg.type) {
			case "signal": {
				const target = this.players.get(msg.targetId);
				if (target) {
					try {
						target.ws.send(
							JSON.stringify({
								type: "signal",
								fromId: playerId,
								signal: msg.signal,
							}),
						);
					} catch {
						// Target connection dead
					}
				}
				break;
			}
			case "move": {
				const x = Math.max(0, Math.min(msg.x, ROOM_CONFIG.MAP_WIDTH));
				const y = Math.max(0, Math.min(msg.y, ROOM_CONFIG.MAP_HEIGHT));

				player.state.x = x;
				player.state.y = y;
				player.state.direction = msg.direction;
				player.state.vx = msg.vx;
				player.state.vy = msg.vy;
				this.persistPlayerState(player.ws, player.state);

				this.broadcast(
					{
						type: "player_move",
						playerId,
						x,
						y,
						direction: msg.direction,
						vx: msg.vx,
						vy: msg.vy,
					},
					playerId,
				);
				break;
			}
			case "stop": {
				const x = Math.max(0, Math.min(msg.x, ROOM_CONFIG.MAP_WIDTH));
				const y = Math.max(0, Math.min(msg.y, ROOM_CONFIG.MAP_HEIGHT));

				player.state.x = x;
				player.state.y = y;
				player.state.direction = msg.direction;
				player.state.vx = 0;
				player.state.vy = 0;
				this.persistPlayerState(player.ws, player.state);

				this.broadcast(
					{
						type: "player_stop",
						playerId,
						x,
						y,
						direction: msg.direction,
					},
					playerId,
				);
				break;
			}
		}
	}

	private broadcast(msg: ServerMessage, excludePlayerId?: string): void {
		const data = JSON.stringify(msg);
		for (const [id, player] of this.players) {
			if (id === excludePlayerId) continue;
			try {
				player.ws.send(data);
			} catch {
				// Connection dead — will be cleaned up on close/error event
			}
		}
	}

	private rehydratePlayers(): void {
		for (const ws of this.ctx.getWebSockets()) {
			const attachment =
				ws.deserializeAttachment() as PlayerSocketAttachment | null;
			const playerState = attachment?.playerState;

			if (!playerState) {
				try {
					ws.close(1011, "Missing player state");
				} catch {
					// Socket may already be closed.
				}
				continue;
			}

			this.players.set(playerState.id, {
				ws,
				state: playerState,
			});
		}
	}

	private persistPlayerState(ws: WebSocket, playerState: PlayerState): void {
		ws.serializeAttachment({
			playerState: { ...playerState },
		} satisfies PlayerSocketAttachment);
	}
}
