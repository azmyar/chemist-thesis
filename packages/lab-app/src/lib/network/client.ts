import type { ClientMessage, ServerMessage } from "@chemist/shared";

function getWsUrl(): string {
	// Use explicit WS URL if set (required for local dev, optional in prod)
	const envUrl = process.env.NEXT_PUBLIC_WS_URL;
	if (envUrl) return envUrl;

	// In production, connect through the same origin via reverse proxy (e.g. Vercel/Cloudflare)
	if (typeof window !== "undefined") {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${protocol}//${window.location.host}`;
	}
	return "ws://localhost:8787";
}

export type ServerMessageHandler = (msg: ServerMessage) => void;

export class GameClient {
	private socket: WebSocket | null = null;
	private handlers: Set<ServerMessageHandler> = new Set();
	private _selfId: string | null = null;
	/** Buffer messages until at least one handler subscribes */
	private pendingMessages: ServerMessage[] = [];

	get selfId(): string | null {
		return this._selfId;
	}

	connect(roomId: string, playerName?: string): void {
		const wsUrl = getWsUrl();
		// When connecting via Next.js proxy (same origin), use /ws/ prefix that gets stripped by rewrite.
		// When connecting directly to lab-server (explicit URL), use server route directly.
		const prefix = process.env.NEXT_PUBLIC_WS_URL ? "" : "/ws";
		const query = playerName
			? `?name=${encodeURIComponent(playerName.trim())}`
			: "";
		const url = `${wsUrl}${prefix}/room/${roomId}${query}`;

		this.socket = new WebSocket(url);

		this.socket.onopen = () => {
			console.log("[GameClient] Connected to room:", roomId);
		};

		this.socket.onmessage = (event) => {
			try {
				const msg: ServerMessage = JSON.parse(event.data);

				if (msg.type === "snapshot") {
					this._selfId = msg.selfId;
				}

				// If no handlers yet (Phaser still loading), buffer messages
				if (this.handlers.size === 0) {
					this.pendingMessages.push(msg);
					return;
				}

				for (const handler of this.handlers) {
					handler(msg);
				}
			} catch {
				console.error("[GameClient] Failed to parse server message");
			}
		};

		this.socket.onclose = (event) => {
			console.log("[GameClient] Disconnected:", event.code, event.reason);
		};

		this.socket.onerror = () => {
			// Use warn instead of error to avoid Next.js error overlay in dev
			console.warn("[GameClient] WebSocket connection failed — running in offline mode");
		};
	}

	send(msg: ClientMessage): void {
		if (this.socket?.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(msg));
		}
	}

	onMessage(handler: ServerMessageHandler): () => void {
		this.handlers.add(handler);

		// Flush any messages that arrived before this handler was registered
		if (this.pendingMessages.length > 0) {
			for (const msg of this.pendingMessages) {
				handler(msg);
			}
			this.pendingMessages = [];
		}

		return () => {
			this.handlers.delete(handler);
		};
	}

	disconnect(): void {
		this.socket?.close();
		this.socket = null;
		this.handlers.clear();
		this._selfId = null;
		this.pendingMessages = [];
	}

	get connected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}
}

// Singleton instance for the game session
export const gameClient = new GameClient();
