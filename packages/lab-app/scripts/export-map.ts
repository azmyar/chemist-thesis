/**
 * Export the full lab map (floor + walls, no objects) as a single SVG.
 *
 * Mirrors the layout from src/game/scenes/LabScene.ts buildGravimetriLab()
 * and the floor/wall drawing from src/game/scenes/BootScene.ts. Wall variant
 * picked per tile using the same NESW auto-tile logic as the live game.
 *
 * Run:  bun run packages/lab-app/scripts/export-map.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "assets", "sprites");
mkdirSync(OUT_DIR, { recursive: true });

const MAP_COLS = 23;
const MAP_ROWS = 19;
const TILE = 32;
const W = MAP_COLS * TILE;
const H = MAP_ROWS * TILE;

interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
	color: string;
}

const rects: Rect[] = [];
let currentFill = "#000";

function push(x: number, y: number, w: number, h: number) {
	rects.push({ x, y, w, h, color: currentFill });
}
function fill(color: string) {
	currentFill = color;
}

// ── Floor tile (tile-floor-lab) at (ox, oy) ──
function drawFloor(ox: number, oy: number) {
	fill("#e2e6ea");
	push(ox, oy, 32, 32);
	fill("#d8dce0");
	push(ox, oy, 16, 16);
	push(ox + 16, oy + 16, 16, 16);
	fill("#cdd1d5");
	push(ox, oy + 31, 32, 1);
	push(ox + 31, oy, 1, 32);
	push(ox, oy + 15, 32, 1);
	push(ox + 15, oy, 1, 32);
}

// ── Wall tile with auto-tile variant ──
// n/e/s/w = true if neighbor in that direction is also a wall.
function drawWall(ox: number, oy: number, n: boolean, e: boolean, s: boolean, w: boolean) {
	// Glass pane base
	fill("#cfe8f2");
	push(ox, oy, 32, 32);
	// Horizontal tint bands
	fill("#bcdcec");
	push(ox, oy, 32, 8);
	push(ox, oy + 24, 32, 8);
	// Diagonal highlight streaks
	fill("#eaf6fb");
	push(ox + 6, oy, 2, 32);
	push(ox + 9, oy, 1, 32);
	fill("#f7fcfe");
	push(ox + 20, oy, 1, 32);

	// Frame edges only on sides facing floor (no wall neighbor).
	if (!n) {
		fill("#8a9199");
		push(ox, oy, 32, 2);
		fill("#5d6269");
		push(ox, oy, 32, 1);
		fill("#6c7178");
		push(ox, oy + 2, 32, 1);
	}
	if (!s) {
		fill("#8a9199");
		push(ox, oy + 30, 32, 2);
		fill("#a7aeb6");
		push(ox, oy + 31, 32, 1);
		fill("#aab2bb");
		push(ox, oy + 29, 32, 1);
	}
	if (!w) {
		fill("#8a9199");
		push(ox, oy, 2, 32);
		fill("#5d6269");
		push(ox, oy, 1, 32);
		fill("#6c7178");
		push(ox + 2, oy, 1, 32);
	}
	if (!e) {
		fill("#8a9199");
		push(ox + 30, oy, 2, 32);
		fill("#a7aeb6");
		push(ox + 31, oy, 1, 32);
		fill("#aab2bb");
		push(ox + 29, oy, 1, 32);
	}
}

// ── Wall layout (mirrors LabScene.buildGravimetriLab) ──
const wallSet = new Set<string>();
const wallKey = (c: number, r: number) => `${c},${r}`;
const place = (c: number, r: number) => {
	if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return;
	wallSet.add(wallKey(c, r));
};

// Outer walls
for (let c = 0; c < MAP_COLS; c++) {
	place(c, 0);
	place(c, MAP_ROWS - 1);
}
for (let r = 0; r < MAP_ROWS; r++) {
	place(0, r);
	place(MAP_COLS - 1, r);
}

type Seg = { axis: "h" | "v"; fixed: number; from: number; to: number; doors: number[] };
const segments: Seg[] = [
	{ axis: "v", fixed: 6, from: 1, to: MAP_ROWS - 2, doors: [8, 11, 16] },
	{ axis: "h", fixed: 10, from: 1, to: 5, doors: [] },
	{ axis: "h", fixed: 14, from: 1, to: 5, doors: [] },
	{ axis: "v", fixed: 17, from: 7, to: 9, doors: [] },
	{ axis: "h", fixed: 7, from: 18, to: 21, doors: [] },
	{ axis: "h", fixed: 9, from: 18, to: 21, doors: [] },
];
for (const seg of segments) {
	for (let i = seg.from; i <= seg.to; i++) {
		if (seg.doors.includes(i)) continue;
		if (seg.axis === "h") place(i, seg.fixed);
		else place(seg.fixed, i);
	}
}

// ── Emit floor everywhere, then walls on top ──
for (let r = 0; r < MAP_ROWS; r++) {
	for (let c = 0; c < MAP_COLS; c++) {
		drawFloor(c * TILE, r * TILE);
	}
}
for (let r = 0; r < MAP_ROWS; r++) {
	for (let c = 0; c < MAP_COLS; c++) {
		if (!wallSet.has(wallKey(c, r))) continue;
		const n = wallSet.has(wallKey(c, r - 1));
		const e = wallSet.has(wallKey(c + 1, r));
		const s = wallSet.has(wallKey(c, r + 1));
		const w = wallSet.has(wallKey(c - 1, r));
		drawWall(c * TILE, r * TILE, n, e, s, w);
	}
}

const body = rects
	.map((r) => `  <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/>`)
	.join("\n");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">\n${body}\n</svg>\n`;

const out = resolve(OUT_DIR, "map.svg");
writeFileSync(out, svg);
console.log(`Wrote ${out} (${rects.length} rects, ${W}×${H})`);
