import Phaser from "phaser";

/**
 * UIScene — HUD overlay that runs in parallel with LabScene.
 * Shows game title, controls hint, and connection status.
 */
export class UIScene extends Phaser.Scene {
	private statusText!: Phaser.GameObjects.Text;

	constructor() {
		super({ key: "UIScene", active: true });
	}

	create() {
		// Touch devices hide the desktop-oriented HUD (title + WASD hint) to
		// avoid collision with the React chat overlay at top-left. Player count
		// moves to bottom-left on mobile so it stays out of gameplay zones.
		const isTouch =
			typeof window !== "undefined" &&
			("ontouchstart" in window || navigator.maxTouchPoints > 0);

		if (!isTouch) {
			// Game title — "chemistlab" lowercase, "chemist" bold + "lab" reguler.
			// "lab" diposisikan tepat di belakang "chemist" via measured width.
			const chemist = this.add
				.text(16, 16, "chemist", {
					fontSize: "16px",
					color: "#1e1e1e",
					fontStyle: "bold",
				})
				.setScrollFactor(0)
				.setDepth(100);
			this.add
				.text(16 + chemist.width, 16, "lab", {
					fontSize: "16px",
					color: "#1e1e1e",
					fontStyle: "normal",
				})
				.setScrollFactor(0)
				.setDepth(100);

			// Controls hint (desktop only — mobile uses virtual joystick)
			this.add
				.text(16, 38, "WASD / Arrow keys untuk bergerak", {
					fontSize: "11px",
					color: "#adb5bd",
				})
				.setScrollFactor(0)
				.setDepth(100);
		}

		// Player count — top-left on desktop (under hints), bottom-left on mobile
		const countY = isTouch ? (this.scale.height ?? 0) - 20 : 56;
		this.statusText = this.add
			.text(16, countY, "", {
				fontSize: "11px",
				color: "#6c757d",
			})
			.setScrollFactor(0)
			.setDepth(100);
	}

	updatePlayerCount(count: number) {
		this.statusText.setText(`${count} pemain online`);
	}
}
