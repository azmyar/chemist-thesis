"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameObjectType } from "@/lib/protocol";

const OBJECT_LABELS: Record<GameObjectType, string> = {
	workbench: "Meja Kerja",
	storage: "Penyimpanan",
};

export function InteractButton() {
	const [nearby, setNearby] = useState<{
		objectId: string;
		objectType: GameObjectType;
	} | null>(null);

	useEffect(() => {
		const onNearbyChanged = ((e: CustomEvent) => {
			setNearby(e.detail);
		}) as EventListener;

		window.addEventListener("nearby-object-changed", onNearbyChanged);
		return () => {
			window.removeEventListener("nearby-object-changed", onNearbyChanged);
		};
	}, []);

	const handleTap = useCallback(() => {
		window.dispatchEvent(new CustomEvent("mobile-interact"));
	}, []);

	if (!nearby) return null;

	return (
		<button
			onTouchStart={handleTap}
			className="fixed bottom-8 right-8 z-20 w-16 h-16 rounded-full bg-amber-400/90 active:bg-amber-500 border-2 border-amber-300 shadow-lg flex flex-col items-center justify-center gap-0.5 touch-manipulation"
		>
			<span className="text-[10px] font-semibold text-amber-900 leading-none">
				{OBJECT_LABELS[nearby.objectType]}
			</span>
			<span className="text-xs font-bold text-amber-800">Buka</span>
		</button>
	);
}
