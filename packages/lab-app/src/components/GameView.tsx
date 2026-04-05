"use client";

import { useEffect, useState } from "react";
import { GameCanvas } from "./GameCanvas";
import { ChatOverlay } from "./ChatOverlay";
import { InteractButton } from "./InteractButton";
import { ObjectSheet } from "./ObjectSheet";
import { VirtualJoystick } from "./VirtualJoystick";
import { gameClient } from "@/lib/network/client";

interface GameViewProps {
	roomId: string;
	playerName?: string;
}

export default function GameView({ roomId, playerName }: GameViewProps) {
	const [connected, setConnected] = useState(false);
	const [connecting, setConnecting] = useState(true);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const detectMobileInput = () => {
			const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
			const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
			setIsMobile(Boolean(hasTouch || coarsePointer));
		};

		detectMobileInput();
		window.addEventListener("resize", detectMobileInput);
		window.addEventListener("orientationchange", detectMobileInput);

		return () => {
			window.removeEventListener("resize", detectMobileInput);
			window.removeEventListener("orientationchange", detectMobileInput);
		};
	}, []);

	useEffect(() => {
		const unsubscribe = gameClient.onConnectionStatusChange((status) => {
			setConnected(status.state === "connected");
			setConnecting(status.state === "connecting");
			setConnectionError(status.state === "error" ? status.message : null);
		});

		gameClient.connect(roomId, playerName);

		return () => {
			unsubscribe();
			gameClient.disconnect();
		};
	}, [roomId, playerName]);

	return (
		<div className="relative w-screen h-screen overflow-hidden">
			<GameCanvas roomId={roomId} />

			{connected && <ChatOverlay />}
			{connected && <ObjectSheet />}

			{/* Connection overlays */}
			{!connected && connecting && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
					<p className="heading-2 text-neutral-300">
						Menghubungkan ke server...
					</p>
				</div>
			)}

			{!connected && connectionError && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/65 z-30">
					<p className="heading-2 text-red-200">{connectionError}</p>
				</div>
			)}

			{isMobile && <VirtualJoystick />}
			{isMobile && <InteractButton />}
		</div>
	);
}
