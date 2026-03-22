"use client";

import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";

const GameView = dynamic(() => import("@/components/GameView"), {
	ssr: false,
	loading: () => (
		<div className="w-screen h-screen flex items-center justify-center bg-neutral-800">
			<p className="heading-2 text-neutral-300">Memuat lab...</p>
		</div>
	),
});

export default function RoomPage() {
	const params = useParams<{ roomId: string }>();
	const searchParams = useSearchParams();
	const playerName = searchParams.get("name") ?? undefined;

	return <GameView roomId={params.roomId} playerName={playerName} />;
}
