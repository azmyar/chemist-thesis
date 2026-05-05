function getServerHttpBase(): string | null {
	const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
	if (wsUrl && /^wss?:\/\//.test(wsUrl)) {
		return wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
	}

	const direct = process.env.LAB_SERVER_URL;
	if (direct && /^https?:\/\//.test(direct)) return direct;

	return null;
}

export async function GET() {
	const serverBase = getServerHttpBase();
	return new Response(
		JSON.stringify({
			ok: true,
			serverBase: serverBase ?? null,
			hasNextPublicWsUrl: Boolean(process.env.NEXT_PUBLIC_WS_URL),
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
}

export async function POST(request: Request) {
	try {
		const serverBase = getServerHttpBase();
		if (!serverBase) {
			return new Response(
				JSON.stringify({ error: "Missing NEXT_PUBLIC_WS_URL or LAB_SERVER_URL" }),
				{ status: 500, headers: { "Content-Type": "application/json" } },
			);
		}

		const body = (await request.json().catch(() => ({}))) as { roomId?: unknown };
		const roomId = typeof body.roomId === "string" && body.roomId.trim() ? body.roomId.trim() : "lab-umum";

		const url = `${serverBase.replace(/\/$/, "")}/admin/reset/${encodeURIComponent(roomId)}`;
		const response = await fetch(url, { method: "POST" });

		const text = await response.text();
		return new Response(text || JSON.stringify({ success: response.ok }), {
			status: response.status,
			headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
		});
	} catch (error) {
		console.error("Reset error:", error);
		return new Response(JSON.stringify({ error: "Reset failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
