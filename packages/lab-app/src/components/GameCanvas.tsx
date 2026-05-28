"use client";

import { useEffect, useRef } from "react";

interface GameCanvasProps {
	roomId: string;
}

export function GameCanvas({ roomId }: GameCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Phaser.Game | null>(null);

	useEffect(() => {
		if (!containerRef.current || gameRef.current) return;

		// Dynamic import Phaser + scenes to avoid SSR issues
		const initGame = async () => {
			const Phaser = await import("phaser");
			const { BootScene } = await import("@/game/scenes/BootScene");
			const { LabScene } = await import("@/game/scenes/LabScene");
			const { UIScene } = await import("@/game/scenes/UIScene");

			const config: Phaser.Types.Core.GameConfig = {
				type: Phaser.AUTO,
				parent: containerRef.current!,
				width: window.innerWidth,
				height: window.innerHeight,
				pixelArt: true,
				backgroundColor: "#1e1e1e",
				scale: {
					mode: Phaser.Scale.RESIZE,
					autoCenter: Phaser.Scale.CENTER_BOTH,
				},
				scene: [BootScene, LabScene, UIScene],
				physics: {
					default: "arcade",
					arcade: {
						gravity: { x: 0, y: 0 },
						debug: false,
					},
				},
			};

			gameRef.current = new Phaser.Game(config);

			// Pass roomId to the game registry for scenes to access
			gameRef.current.registry.set("roomId", roomId);

			// Debug: expose game for e2e testing
			if (typeof window !== "undefined") {
				(window as unknown as { __chemistGame?: Phaser.Game }).__chemistGame = gameRef.current;
			}
		};

		initGame().catch((error) => {
			console.error("[GameCanvas] Failed to initialize game", error);
		});

		return () => {
			gameRef.current?.destroy(true);
			gameRef.current = null;
		};
	}, [roomId]);

	return <div ref={containerRef} id="game-canvas" className="w-full h-full" />;
}
