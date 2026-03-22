"use client";

import { useEffect, useState } from "react";
import { GameCanvas } from "./GameCanvas";
import { VirtualJoystick } from "./VirtualJoystick";
import { gameClient } from "@/lib/network/client";

interface GameViewProps {
	roomId: string;
	playerName?: string;
}

export default function GameView({ roomId, playerName }: GameViewProps) {
	const [connected, setConnected] = useState(false);
	const [connecting, setConnecting] = useState(true);
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
		gameClient.connect(roomId, playerName);

		const checkConnection = setInterval(() => {
			const isConnected = gameClient.connected;
			setConnected(isConnected);
		}, 500);

		// After 3 seconds, stop blocking the UI even if not connected (offline/dev mode)
		const timeout = setTimeout(() => {
			setConnecting(false);
		}, 3000);

		return () => {
			clearInterval(checkConnection);
			clearTimeout(timeout);
			gameClient.disconnect();
		};
	}, [roomId, playerName]);

	return (
		<div className="relative w-screen h-screen overflow-hidden">
			<GameCanvas roomId={roomId} />

			{/* Connection overlays */}
			{!connected && connecting && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
					<p className="heading-2 text-neutral-300">
						Menghubungkan ke server...
					</p>
				</div>
			)}

			{!connected && !connecting && (
				<div className="absolute top-12 right-4 bg-neutral-700/80 text-neutral-400 body-4 px-3 py-1.5 rounded-lg z-30">
					Offline — mode lokal
				</div>
			)}


			{isMobile && <VirtualJoystick />}
		</div>
	);
}
