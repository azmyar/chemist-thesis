import type { ClientMessage, ServerMessage } from "@/lib/protocol";

function getWsUrl(): string {
	// Use explicit WS URL if set (required for local dev, optional in prod)
	const envUrl = process.env.NEXT_PUBLIC_WS_URL;
	if (envUrl) return envUrl;

	// In production, connect through the same origin via reverse proxy (e.g. Vercel/Cloudflare)
	if (typeof window !== "undefined") {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${protocol}//${window.location.host}`;
	}
	return "ws://localhost:8788";
}

export type ServerMessageHandler = (msg: ServerMessage) => void;
export type ConnectionState = "idle" | "connecting" | "connected" | "error";
export interface ConnectionStatus {
	state: ConnectionState;
	message: string | null;
}
export type ConnectionStatusHandler = (status: ConnectionStatus) => void;

export class GameClient {
	private socket: WebSocket | null = null;
	private handlers: Set<ServerMessageHandler> = new Set();
	private connectionHandlers: Set<ConnectionStatusHandler> = new Set();
	private _selfId: string | null = null;
	private roomId: string | null = null;
	private playerName?: string;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private manualDisconnect = false;
	private _connectionStatus: ConnectionStatus = {
		state: "idle",
		message: null,
	};
	private readonly sessionId: string = this.getOrCreateSessionId();
	/** Buffer messages until at least one handler subscribes */
	private pendingMessages: ServerMessage[] = [];

	get selfId(): string | null {
		return this._selfId;
	}

	connect(roomId: string, playerName?: string): void {
		this.roomId = roomId;
		this.playerName = playerName;
		this.manualDisconnect = false;
		this.clearReconnectTimer();
		this._selfId = null;
		this.openSocket();
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

	onConnectionStatusChange(handler: ConnectionStatusHandler): () => void {
		this.connectionHandlers.add(handler);
		handler(this._connectionStatus);

		return () => {
			this.connectionHandlers.delete(handler);
		};
	}

	disconnect(): void {
		this.manualDisconnect = true;
		this.roomId = null;
		this.playerName = undefined;
		this.clearReconnectTimer();
		this.closeSocket();
		this.handlers.clear();
		this._selfId = null;
		this.pendingMessages = [];
		this.setConnectionStatus("idle");
	}

	get connected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	private setConnectionStatus(
		state: ConnectionState,
		message: string | null = null,
	): void {
		this._connectionStatus = { state, message };

		for (const handler of this.connectionHandlers) {
			handler(this._connectionStatus);
		}
	}

	private openSocket(): void {
		if (!this.roomId) return;

		this.closeSocket();

		const wsUrl = getWsUrl();
		// When connecting via Next.js proxy (same origin), use /ws/ prefix that gets stripped by rewrite.
		// When connecting directly to lab-server (explicit URL), use server route directly.
		const prefix = process.env.NEXT_PUBLIC_WS_URL ? "" : "/ws";
		const params = new URLSearchParams();
		if (this.playerName?.trim()) {
			params.set("name", this.playerName.trim());
		}
		params.set("sid", this.sessionId);
		const query = `?${params.toString()}`;
		const url = `${wsUrl}${prefix}/room/${this.roomId}${query}`;
		const socket = new WebSocket(url);

		this.socket = socket;
		this.setConnectionStatus("connecting");

		socket.onopen = () => {
			if (this.socket !== socket) return;
			this.setConnectionStatus("connected");
			console.log("[GameClient] Connected to room:", this.roomId);
		};

		socket.onmessage = (event) => {
			if (this.socket !== socket) return;

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

		socket.onclose = (event) => {
			if (this.socket !== socket) return;
			this.socket = null;
			console.log("[GameClient] Disconnected:", event.code, event.reason);

			if (this.manualDisconnect) {
				this.setConnectionStatus("idle");
				return;
			}

			const message =
				this._connectionStatus.state === "connected"
					? "Koneksi ke server terputus, mencoba menyambung ulang..."
					: "Gagal terhubung ke server, mencoba lagi...";
			this.setConnectionStatus("error", message);
			this.scheduleReconnect();
		};

		socket.onerror = () => {
			if (this.socket !== socket) return;
			// Use warn instead of error to avoid Next.js error overlay in dev
			console.warn("[GameClient] WebSocket connection failed");
		};
	}

	private closeSocket(): void {
		const socket = this.socket;
		if (!socket) return;

		socket.onopen = null;
		socket.onmessage = null;
		socket.onclose = null;
		socket.onerror = null;
		socket.close();
		this.socket = null;
	}

	private scheduleReconnect(): void {
		if (this.manualDisconnect || this.reconnectTimer || !this.roomId) return;

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			if (this.manualDisconnect || !this.roomId) return;
			this.openSocket();
		}, 1500);
	}

	private clearReconnectTimer(): void {
		if (!this.reconnectTimer) return;
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
	}

	private getOrCreateSessionId(): string {
		if (typeof window === "undefined") {
			return `guest-${Math.random().toString(36).slice(2, 12)}`;
		}

		const storageKey = "chemist-lab-session-id";
		// localStorage (bukan sessionStorage) agar ID—dan dengan demikian progres
		// milestone siswa—bertahan meski tab ditutup lalu dibuka kembali.
		const existing = window.localStorage.getItem(storageKey);
		if (existing && /^[a-z0-9-]{4,64}$/.test(existing)) {
			return existing;
		}

		// Migrasi ID lama dari sessionStorage bila ada, supaya progres tidak putus.
		const legacy = window.sessionStorage.getItem(storageKey);
		const created = legacy && /^[a-z0-9-]{4,64}$/.test(legacy)
			? legacy
			: `guest-${Math.random().toString(36).slice(2, 12)}`;
		window.localStorage.setItem(storageKey, created);
		return created;
	}
}

// Singleton instance for the game session
export const gameClient = new GameClient();
