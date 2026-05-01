export async function POST() {
	try {
		// Call the server reset endpoint
		const response = await fetch(
			"https://chemist-lab-server.chemist-dev.workers.dev/admin/reset/lab-umum",
			{ method: "POST" }
		);

		if (!response.ok) {
			return new Response(JSON.stringify({ error: "Server reset failed" }), {
				status: response.status,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(JSON.stringify({ success: true, message: "All state reset" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Reset error:", error);
		return new Response(JSON.stringify({ error: "Reset failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
