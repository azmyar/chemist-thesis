import { Hono } from "hono";
import { cors } from "hono/cors";
import { GameRoom } from "./rooms/GameRoom";

// Re-export DO class so Wrangler can find it
export { GameRoom };
export class GameRoomV2 extends GameRoom {}

type Env = {
	GAME_ROOM: DurableObjectNamespace;
	FRONTEND_ORIGIN?: string;
};

const app = new Hono<{ Bindings: Env }>();

function parseAllowedOrigins(value?: string): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
	return allowedOrigins.includes(origin);
}

// ── CORS ──────────────────────────────────────────

app.use(
	"*",
	async (c, next) => {
		const allowedOrigins = parseAllowedOrigins(c.env.FRONTEND_ORIGIN);

		const corsMiddleware = cors({
			origin: (origin) => {
				if (!origin) return "*";
				if (isOriginAllowed(origin, allowedOrigins)) return origin;
				if (origin.endsWith(".chemist.id")) return origin;
				if (origin.startsWith("http://localhost:")) return origin;
				return allowedOrigins[0] ?? "http://localhost:3001";
			},
			allowHeaders: ["Content-Type", "Authorization", "Upgrade"],
			allowMethods: ["GET", "POST", "OPTIONS"],
			credentials: true,
		});

		return corsMiddleware(c, next);
	},
);

// ── Health Check ──────────────────────────────────

app.get("/", (c) => c.json({ status: "ok", service: "chemist-lab-server" }));

// ── Room List (static for MVP) ────────────────────

app.get("/rooms", (c) => {
	return c.json({
		success: true,
		data: [
			{
				id: "lab-umum",
				name: "Lab Umum",
				description: "Laboratorium kimia umum — tempat kumpul bareng",
				maxPlayers: 20,
			},
		],
	});
});

// ── WebSocket Upgrade → Durable Object ────────────

app.get("/room/:roomId", async (c) => {
	const roomId = c.req.param("roomId");
	const id = c.env.GAME_ROOM.idFromName(roomId);
	const stub = c.env.GAME_ROOM.get(id);

	// Forward the entire request (including cookies + upgrade headers) to the DO
	const url = new URL(c.req.url);
	url.pathname = "/ws";
	const playerName = c.req.query("name");
	if (playerName) {
		url.searchParams.set("name", playerName);
	}

	return stub.fetch(new Request(url.toString(), c.req.raw));
});

export default app;
