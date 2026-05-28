"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChemButton } from "./ui/ChemButton";
import { ChemistLogomark } from "./ui/ChemistLogomark";

interface LobbyViewProps {
	user: {
		user: { id: string };
		profile: { name: string } | null;
	};
}

const rooms = [
	{
		id: "lab-umum",
		name: "Lab Gravimetri",
		description: "Penetapan kadar tembaga metode gravimetri",
		maxPlayers: 20,
	},
];

function BeakerIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M6 3h12" />
			<path d="M8 3v6l-3.5 8.5A1.8 1.8 0 0 0 6.2 20h11.6a1.8 1.8 0 0 0 1.7-2.5L16 9V3" />
			<path d="M6.5 14h11" />
		</svg>
	);
}

export function LobbyView({ user }: LobbyViewProps) {
	const router = useRouter();
	const [joining, setJoining] = useState(false);
	const [playerName, setPlayerName] = useState(user.profile?.name ?? "Pemain");

	const handleJoin = (roomId: string) => {
		setJoining(true);
		const encodedName = encodeURIComponent(playerName.trim() || "Pemain");
		router.push(`/room/${roomId}?name=${encodedName}`);
	};

	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-5 py-10 sm:px-6">
			<div className="w-full max-w-md">
				{/* Logo + judul */}
				<div className="mb-7 flex flex-col items-center text-center sm:mb-8">
					<div className="animate-hero-float mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] border border-neutral-200 bg-white shadow-sm">
						<ChemistLogomark className="h-8 w-8 text-primary-500" />
					</div>
					<h1 className="title-1 text-neutral-800 lowercase tracking-tight">
						<span className="font-bold">chemist</span>
						<span className="font-normal">lab</span>
					</h1>
					<p className="body-3 mt-2 text-neutral-500">
						Simulasi Laboratorium Kimia Virtual
					</p>
				</div>

				{/* Kartu */}
				<div className="rounded-[18px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
					<p className="body-3 text-neutral-600">
						Halo,{" "}
						<span className="font-bold text-neutral-800">
							{user.profile?.name ?? "Pemain"}
						</span>
						! Pilih lab yang mau kamu masuki.
					</p>

					<label className="mt-5 block">
						<span className="body-4 text-neutral-600">Nama pemain</span>
						<input
							type="text"
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							maxLength={24}
							className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
						/>
					</label>

					<div className="mt-5 space-y-4">
						{rooms.map((room) => (
							<div
								key={room.id}
								className="group rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md"
							>
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-transform group-hover:scale-105">
										<BeakerIcon className="h-5 w-5" />
									</div>
									<div className="min-w-0">
										<h2 className="heading-1 text-neutral-800">{room.name}</h2>
										<p className="body-4 mt-0.5 text-neutral-500">
											{room.description}
										</p>
									</div>
								</div>
								<div className="mt-4 flex items-center justify-between gap-3">
									<span className="body-4 inline-flex items-center gap-1.5 text-neutral-400">
										<span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
										Maks {room.maxPlayers} pemain
									</span>
									<ChemButton
										variant="primary"
										onClick={() => handleJoin(room.id)}
										disabled={joining}
										className="w-auto min-w-[140px]"
									>
										{joining ? "Masuk..." : "Masuk Lab →"}
									</ChemButton>
								</div>
							</div>
						))}
					</div>
				</div>

				<p className="body-4 mt-6 text-center text-neutral-400">
					Praktikum Kimia Gravimetri · SMK-SMAK Bogor
				</p>
			</div>
		</div>
	);
}
