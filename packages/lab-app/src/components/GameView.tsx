"use client";

import { useEffect, useState } from "react";
import { GameCanvas } from "./GameCanvas";
import { ChatOverlay } from "./ChatOverlay";
import { ConceptFeedbackModal } from "./ConceptFeedbackModal";
import { GuidedConceptCheckModal } from "./GuidedConceptCheckModal";
import { InteractButton } from "./InteractButton";
import { LevelOverlay } from "./LevelOverlay";
import { ObjectSheet } from "./ObjectSheet";
import { ProcessProgress } from "./ProcessProgress";
import { ReportPanel } from "./ReportPanel";
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
		<div className="relative w-screen h-[100dvh] overflow-hidden">
			<GameCanvas roomId={roomId} />

			{/*
				Overlay selalu di-mount (TIDAK digate `connected`) supaya useEffect
				listener mereka — `object-items-changed`, `level-state`,
				`local-hold-changed`, dst. — terdaftar SEBELUM Phaser/LabScene
				men-dispatch snapshot. Sebelumnya, jika Phaser bootstrap lebih cepat
				dari React commit (mis. cache hangat), event di-dispatch sebelum
				ObjectSheet sempat register listener → alat/bahan tidak muncul.
				Tiap overlay punya early-return saat state-nya kosong, jadi
				mounting tanpa data tidak menampilkan UI.
			*/}
			<LevelOverlay />
			<ChatOverlay />
			<ObjectSheet />
			<ReportPanel />
			<ConceptFeedbackModal />
			<GuidedConceptCheckModal />
			<ProcessProgress />

			{/* Connection overlays — z-[100] supaya menutupi overlay (z-40..z-90) */}
			{!connected && connecting && (
				<div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60">
					<p className="heading-2 text-neutral-300">
						Menghubungkan ke server...
					</p>
				</div>
			)}

			{!connected && connectionError && (
				<div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70">
					<p className="heading-2 text-red-200">{connectionError}</p>
				</div>
			)}

			{isMobile && <VirtualJoystick />}
			{isMobile && <InteractButton />}
		</div>
	);
}
