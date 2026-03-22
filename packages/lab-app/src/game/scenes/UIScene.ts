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
		// Game title
		this.add
			.text(16, 16, "ChemistLab", {
				fontSize: "16px",
				color: "#0590d6",
				fontStyle: "bold",
			})
			.setScrollFactor(0)
			.setDepth(100);

		// Controls hint
		this.add
			.text(16, 38, "WASD / Arrow keys untuk bergerak", {
				fontSize: "11px",
				color: "#adb5bd",
			})
			.setScrollFactor(0)
			.setDepth(100);

		// Player count (updated from LabScene)
		this.statusText = this.add
			.text(16, 56, "", {
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
