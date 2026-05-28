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
				name: "Lab Gravimetri",
				description: "Penetapan kadar tembaga metode gravimetri",
				maxPlayers: 20,
			},
		],
	});
});

// ── Reset Room State ──────────────────────────────

app.post("/admin/reset/:roomId", async (c) => {
	const roomId = c.req.param("roomId");
	const id = c.env.GAME_ROOM.idFromName(roomId);
	const stub = c.env.GAME_ROOM.get(id);

	const response = await stub.fetch(new Request(new URL("/reset", c.req.url).toString(), { method: "POST" }));
	return response;
});

// ── Export Progres Siswa (penelitian) ─────────────
// GET /admin/progress/lab-umum            → JSON semua siswa
// GET /admin/progress/lab-umum?format=csv → CSV (impor ke spreadsheet/SPSS)

app.get("/admin/progress/:roomId", async (c) => {
	const roomId = c.req.param("roomId");
	const id = c.env.GAME_ROOM.idFromName(roomId);
	const stub = c.env.GAME_ROOM.get(id);

	const target = new URL("/progress", c.req.url);
	const format = c.req.query("format");
	if (format) target.searchParams.set("format", format);

	return stub.fetch(new Request(target.toString(), { method: "GET" }));
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
	// Sertakan roomId agar DO bisa mencatatnya ke D1 (penelitian).
	url.searchParams.set("room", roomId);

	return stub.fetch(new Request(url.toString(), c.req.raw));
});

export default app;
