"use client";

import { useEffect, useState, useCallback } from "react";
import { GameCanvas } from "./GameCanvas";
import { VirtualJoystick } from "./VirtualJoystick";
import { gameClient } from "@/lib/network/client";
import { voiceChat } from "@/lib/network/voice";

interface GameViewProps {
	roomId: string;
	playerName?: string;
}

export default function GameView({ roomId, playerName }: GameViewProps) {
	const [connected, setConnected] = useState(false);
	const [connecting, setConnecting] = useState(true);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);
	const [muted, setMuted] = useState(true);

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

		// Initialize voice chat
		voiceChat.init();
		voiceChat.onMuteStateChange(setMuted);

		return () => {
			unsubscribe();
			voiceChat.destroy();
			gameClient.disconnect();
		};
	}, [roomId, playerName]);

	const handleToggleMute = useCallback(() => {
		voiceChat.toggleMute();
	}, []);

	return (
		<div className="relative w-screen h-screen overflow-hidden">
			<GameCanvas roomId={roomId} />

			{/* Voice chat toggle */}
			{connected && (
				<button
					onClick={handleToggleMute}
					className="absolute bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-600"
					title={muted ? "Unmute microphone" : "Mute microphone"}
				>
					{muted ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#ef4444"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="1" y1="1" x2="23" y2="23" />
							<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
							<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18" />
							<line x1="12" y1="19" x2="12" y2="23" />
							<line x1="8" y1="23" x2="16" y2="23" />
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#4ade80"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<line x1="12" y1="19" x2="12" y2="23" />
							<line x1="8" y1="23" x2="16" y2="23" />
						</svg>
					)}
				</button>
			)}

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
		</div>
	);
}
