"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LobbyViewProps {
	user: {
		user: { id: string };
		profile: { name: string } | null;
	};
}

const rooms = [
	{
		id: "lab-umum",
		name: "Lab Umum",
		description: "Laboratorium kimia umum — tempat kumpul bareng",
		maxPlayers: 20,
	},
];

export function LobbyView({ user }: LobbyViewProps) {
	const router = useRouter();
	const [joining, setJoining] = useState(false);
	const [playerName, setPlayerName] = useState(user.profile?.name ?? "Pemain");
	const [resetting, setResetting] = useState(false);

	const handleJoin = (roomId: string) => {
		setJoining(true);
		const encodedName = encodeURIComponent(playerName.trim() || "Pemain");
		router.push(`/room/${roomId}?name=${encodedName}`);
	};

	const handleReset = async () => {
		if (!confirm("Yakin reset semua progress? Ini tidak bisa dibatalkan.")) return;
		setResetting(true);
		try {
			// Clear client storage
			localStorage.clear();
			sessionStorage.clear();

			// Call server reset
			const res = await fetch("/api/reset-state", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ roomId: "lab-umum" }),
			});
			if (res.ok) {
				alert("Progress reset berhasil!");
				window.location.reload();
			} else {
				alert("Gagal reset server");
			}
		} catch (error) {
			console.error("Reset error:", error);
			alert("Gagal reset");
		} finally {
			setResetting(false);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-800 flex flex-col items-center justify-center p-6">
			<div className="max-w-md w-full">
				<div className="flex items-center justify-between mb-2">
					<h1 className="title-2 text-neutral-50">ChemistLab</h1>
					<button
						type="button"
						onClick={handleReset}
						disabled={resetting}
						className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
					>
						{resetting ? "Mereset..." : "Reset"}
					</button>
				</div>
				<p className="body-3 text-neutral-400 mb-8">
					Halo, {user.profile?.name ?? "Pemain"}! Pilih lab yang mau kamu
					masuki.
				</p>

				<label className="block mb-4">
					<span className="body-4 text-neutral-300">Nama pemain</span>
					<input
						type="text"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						maxLength={24}
						className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-2 text-neutral-100 outline-none focus:border-primary-500"
					/>
				</label>

				<div className="space-y-4">
					{rooms.map((room) => (
						<div
							key={room.id}
							className="bg-neutral-700 rounded-xl p-4 border border-neutral-600"
						>
							<h2 className="heading-1 text-neutral-50">{room.name}</h2>
							<p className="body-4 text-neutral-400 mt-1">{room.description}</p>
							<div className="flex items-center justify-between mt-4">
								<span className="body-4 text-neutral-500">
									Maks {room.maxPlayers} pemain
								</span>
								<button
									type="button"
									onClick={() => handleJoin(room.id)}
									disabled={joining}
									className="bg-primary-500 hover:bg-primary-600 text-white heading-3 px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
								>
									{joining ? "Masuk..." : "Masuk Lab"}
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
