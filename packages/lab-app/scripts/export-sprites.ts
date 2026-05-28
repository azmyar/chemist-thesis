/**
 * Export every procedural sprite from BootScene.ts as an SVG file.
 *
 * The drawing code is copied verbatim from
 *   src/game/scenes/BootScene.ts
 * and replayed against a Recorder that captures every fillRect call. Each
 * recorded rect becomes a single <rect> element in the output SVG.
 *
 * Run:  bun run packages/lab-app/scripts/export-sprites.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Recorder shim that mimics CanvasRenderingContext2D ─────────────────

interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
	color: string;
}

class Recorder {
	fillStyle: string = "#000000";
	rects: Rect[] = [];

	fillRect(x: number, y: number, w: number, h: number) {
		this.rects.push({ x, y, w, h, color: this.fillStyle });
	}
}

interface FakeTexture {
	context: Recorder;
	width: number;
	height: number;
	key: string;
	refresh: () => void;
}

const sprites: { key: string; width: number; height: number; rects: Rect[] }[] =
	[];

function createCanvas(key: string, width: number, height: number): FakeTexture {
	const ctx = new Recorder();
	const tex: FakeTexture = {
		context: ctx,
		width,
		height,
		key,
		refresh() {
			sprites.push({ key, width, height, rects: ctx.rects });
		},
	};
	return tex;
}

const textures = {
	createCanvas: (key: string, w: number, h: number): FakeTexture | null =>
		createCanvas(key, w, h),
};

// ── SVG emission ───────────────────────────────────────────────────────

function escapeAttr(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function rectsToSvg(width: number, height: number, rects: Rect[]): string {
	const lines: string[] = [];
	lines.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`,
	);
	for (const r of rects) {
		lines.push(
			`  <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${escapeAttr(r.color)}"/>`,
		);
	}
	lines.push("</svg>");
	return lines.join("\n") + "\n";
}

// ── generateTiles (copied verbatim, ctx-prefixed handles only) ─────────

function generateTiles() {
	// Floor tile — 32×32 with subtle grout lines
	const floor = textures.createCanvas("tile-floor", 32, 32)!;
	const fCtx = floor.context;
	fCtx.fillStyle = "#e9ecef";
	fCtx.fillRect(0, 0, 32, 32);
	fCtx.fillStyle = "#dee2e6";
	fCtx.fillRect(0, 31, 32, 1);
	fCtx.fillRect(31, 0, 1, 32);
	fCtx.fillRect(0, 15, 32, 1);
	fCtx.fillRect(15, 0, 1, 32);
	fCtx.fillStyle = "#dde1e5";
	fCtx.fillRect(6, 6, 3, 3);
	fCtx.fillRect(22, 22, 3, 3);
	fCtx.fillRect(6, 22, 2, 2);
	fCtx.fillRect(22, 6, 2, 2);
	floor.refresh();

	for (let i = 0; i < 16; i++) {
		const n = (i & 8) !== 0;
		const e = (i & 4) !== 0;
		const s = (i & 2) !== 0;
		const w = (i & 1) !== 0;
		const key = `tile-wall-${i}`;
		const wall = textures.createCanvas(key, 32, 32)!;
		const wCtx = wall.context;

		wCtx.fillStyle = "#cfe8f2";
		wCtx.fillRect(0, 0, 32, 32);
		wCtx.fillStyle = "#bcdcec";
		wCtx.fillRect(0, 0, 32, 8);
		wCtx.fillRect(0, 24, 32, 8);
		wCtx.fillStyle = "#eaf6fb";
		wCtx.fillRect(6, 0, 2, 32);
		wCtx.fillRect(9, 0, 1, 32);
		wCtx.fillStyle = "#f7fcfe";
		wCtx.fillRect(20, 0, 1, 32);

		if (!n) {
			wCtx.fillStyle = "#8a9199";
			wCtx.fillRect(0, 0, 32, 2);
			wCtx.fillStyle = "#5d6269";
			wCtx.fillRect(0, 0, 32, 1);
			wCtx.fillStyle = "#6c7178";
			wCtx.fillRect(0, 2, 32, 1);
		}
		if (!s) {
			wCtx.fillStyle = "#8a9199";
			wCtx.fillRect(0, 30, 32, 2);
			wCtx.fillStyle = "#a7aeb6";
			wCtx.fillRect(0, 31, 32, 1);
			wCtx.fillStyle = "#aab2bb";
			wCtx.fillRect(0, 29, 32, 1);
		}
		if (!w) {
			wCtx.fillStyle = "#8a9199";
			wCtx.fillRect(0, 0, 2, 32);
			wCtx.fillStyle = "#5d6269";
			wCtx.fillRect(0, 0, 1, 32);
			wCtx.fillStyle = "#6c7178";
			wCtx.fillRect(2, 0, 1, 32);
		}
		if (!e) {
			wCtx.fillStyle = "#8a9199";
			wCtx.fillRect(30, 0, 2, 32);
			wCtx.fillStyle = "#a7aeb6";
			wCtx.fillRect(31, 0, 1, 32);
			wCtx.fillStyle = "#aab2bb";
			wCtx.fillRect(29, 0, 1, 32);
		}
		wall.refresh();
	}

	// Lab table — 64×32
	const table = textures.createCanvas("lab-table", 64, 32)!;
	const tCtx = table.context;
	tCtx.fillStyle = "#5c4a32";
	tCtx.fillRect(0, 8, 64, 24);
	tCtx.fillStyle = "#7a6244";
	tCtx.fillRect(2, 8, 60, 6);
	tCtx.fillStyle = "#8b7355";
	tCtx.fillRect(4, 10, 56, 2);
	tCtx.fillStyle = "#4a3a25";
	tCtx.fillRect(4, 28, 4, 4);
	tCtx.fillRect(56, 28, 4, 4);
	tCtx.fillStyle = "#3d2e1c";
	tCtx.fillRect(0, 6, 64, 2);
	table.refresh();
}

// ── generateLabEquipment (copied verbatim) ─────────────────────────────

function generateLabEquipment() {
	const labFloor = textures.createCanvas("tile-floor-lab", 32, 32)!;
	const lfCtx = labFloor.context;
	lfCtx.fillStyle = "#e2e6ea";
	lfCtx.fillRect(0, 0, 32, 32);
	lfCtx.fillStyle = "#d8dce0";
	lfCtx.fillRect(0, 0, 16, 16);
	lfCtx.fillRect(16, 16, 16, 16);
	lfCtx.fillStyle = "#cdd1d5";
	lfCtx.fillRect(0, 31, 32, 1);
	lfCtx.fillRect(31, 0, 1, 32);
	lfCtx.fillRect(0, 15, 32, 1);
	lfCtx.fillRect(15, 0, 1, 32);
	labFloor.refresh();

	const wb = textures.createCanvas("whiteboard", 96, 32)!;
	const wbCtx = wb.context;
	wbCtx.fillStyle = "#868e96";
	wbCtx.fillRect(0, 0, 96, 32);
	wbCtx.fillStyle = "#f8f9fa";
	wbCtx.fillRect(3, 3, 90, 22);
	wbCtx.fillStyle = "#e9ecef";
	wbCtx.fillRect(3, 21, 90, 4);
	wbCtx.fillStyle = "#4dabf7";
	wbCtx.fillRect(10, 7, 20, 2);
	wbCtx.fillRect(10, 11, 16, 2);
	wbCtx.fillRect(10, 15, 22, 2);
	wbCtx.fillStyle = "#ff6b6b";
	wbCtx.fillRect(50, 7, 14, 2);
	wbCtx.fillRect(50, 11, 18, 2);
	wbCtx.fillStyle = "#adb5bd";
	wbCtx.fillRect(30, 26, 36, 4);
	wbCtx.fillStyle = "#228be6";
	wbCtx.fillRect(34, 27, 6, 2);
	wbCtx.fillStyle = "#e03131";
	wbCtx.fillRect(42, 27, 6, 2);
	wbCtx.fillStyle = "#2f9e44";
	wbCtx.fillRect(50, 27, 6, 2);
	wbCtx.fillStyle = "#dee2e6";
	wbCtx.fillRect(58, 27, 6, 2);
	wb.refresh();

	const td = textures.createCanvas("teacher-desk", 64, 32)!;
	const tdCtx = td.context;
	tdCtx.fillStyle = "#5c4a32";
	tdCtx.fillRect(0, 4, 64, 28);
	tdCtx.fillStyle = "#7a6244";
	tdCtx.fillRect(2, 4, 60, 8);
	tdCtx.fillStyle = "#8b7355";
	tdCtx.fillRect(4, 6, 56, 4);
	tdCtx.fillStyle = "#917b5f";
	tdCtx.fillRect(8, 7, 20, 1);
	tdCtx.fillRect(34, 8, 18, 1);
	tdCtx.fillStyle = "#adb5bd";
	tdCtx.fillRect(44, 10, 14, 12);
	tdCtx.fillStyle = "#868e96";
	tdCtx.fillRect(46, 12, 10, 8);
	tdCtx.fillStyle = "#74c0fc";
	tdCtx.fillRect(48, 14, 6, 4);
	tdCtx.fillStyle = "#6c757d";
	tdCtx.fillRect(50, 10, 2, 3);
	tdCtx.fillStyle = "#4a3a25";
	tdCtx.fillRect(6, 16, 30, 12);
	tdCtx.fillStyle = "#6b5535";
	tdCtx.fillRect(8, 18, 26, 8);
	tdCtx.fillStyle = "#adb5bd";
	tdCtx.fillRect(18, 21, 6, 2);
	tdCtx.fillStyle = "#4a3a25";
	tdCtx.fillRect(4, 28, 4, 4);
	tdCtx.fillRect(56, 28, 4, 4);
	tdCtx.fillStyle = "#3d2e1c";
	tdCtx.fillRect(0, 3, 64, 1);
	td.refresh();

	const bench = textures.createCanvas("workbench", 32, 32)!;
	const benchCtx = bench.context;
	benchCtx.fillStyle = "#f8f9fa";
	benchCtx.fillRect(0, 4, 32, 16);
	benchCtx.fillStyle = "#ffffff";
	benchCtx.fillRect(1, 4, 30, 2);
	benchCtx.fillStyle = "#dee2e6";
	benchCtx.fillRect(0, 3, 32, 1);
	benchCtx.fillStyle = "#e9ecef";
	benchCtx.fillRect(0, 6, 1, 14);
	benchCtx.fillRect(31, 6, 1, 14);
	benchCtx.fillStyle = "#ced4da";
	benchCtx.fillRect(2, 20, 3, 12);
	benchCtx.fillRect(27, 20, 3, 12);
	benchCtx.fillStyle = "#e9ecef";
	benchCtx.fillRect(3, 20, 1, 11);
	benchCtx.fillRect(28, 20, 1, 11);
	benchCtx.fillStyle = "#dee2e6";
	benchCtx.fillRect(0, 19, 32, 1);
	bench.refresh();

	const mt = textures.createCanvas("meja-tengah", 32, 32)!;
	const mtCtx = mt.context;
	mtCtx.fillStyle = "#5c4a32";
	mtCtx.fillRect(0, 4, 32, 16);
	mtCtx.fillStyle = "#7a6244";
	mtCtx.fillRect(1, 4, 30, 4);
	mtCtx.fillStyle = "#8b7355";
	mtCtx.fillRect(2, 5, 28, 1);
	mtCtx.fillRect(4, 10, 24, 1);
	mtCtx.fillStyle = "#3d2e1c";
	mtCtx.fillRect(0, 3, 32, 1);
	mtCtx.fillRect(0, 19, 32, 1);
	mtCtx.fillStyle = "#4a3a25";
	mtCtx.fillRect(0, 4, 1, 16);
	mtCtx.fillRect(31, 4, 1, 16);
	mtCtx.fillStyle = "#3d2e1c";
	mtCtx.fillRect(2, 20, 3, 12);
	mtCtx.fillRect(27, 20, 3, 12);
	mtCtx.fillStyle = "#4a3a25";
	mtCtx.fillRect(3, 20, 1, 11);
	mtCtx.fillRect(28, 20, 1, 11);
	mtCtx.fillStyle = "#a5d8ff";
	mtCtx.fillRect(6, 1, 3, 3);
	mtCtx.fillStyle = "#ffd43b";
	mtCtx.fillRect(14, 2, 2, 2);
	mtCtx.fillStyle = "#69db7c";
	mtCtx.fillRect(22, 1, 3, 3);
	mt.refresh();

	const stor = textures.createCanvas("storage", 32, 32)!;
	const sCtx = stor.context;
	sCtx.fillStyle = "#f8f9fa";
	sCtx.fillRect(2, 2, 28, 28);
	sCtx.fillStyle = "#dee2e6";
	sCtx.fillRect(2, 2, 28, 1);
	sCtx.fillRect(2, 29, 28, 1);
	sCtx.fillRect(2, 2, 1, 28);
	sCtx.fillRect(29, 2, 1, 28);
	sCtx.fillStyle = "#ced4da";
	sCtx.fillRect(4, 15, 24, 1);
	sCtx.fillStyle = "#adb5bd";
	sCtx.fillRect(14, 9, 4, 2);
	sCtx.fillRect(14, 21, 4, 2);
	sCtx.fillStyle = "#ffffff";
	sCtx.fillRect(3, 3, 26, 1);
	stor.refresh();

	const wb2 = textures.createCanvas("waste-bin", 32, 32)!;
	const wbCtx2 = wb2.context;
	wbCtx2.fillStyle = "#868e96";
	wbCtx2.fillRect(13, 3, 6, 3);
	wbCtx2.fillStyle = "#495057";
	wbCtx2.fillRect(12, 2, 8, 2);
	wbCtx2.fillStyle = "#343a40";
	wbCtx2.fillRect(12, 2, 8, 1);
	wbCtx2.fillStyle = "#f8f9fa";
	wbCtx2.fillRect(5, 6, 22, 24);
	wbCtx2.fillStyle = "#ffffff";
	wbCtx2.fillRect(6, 7, 3, 22);
	wbCtx2.fillStyle = "#dee2e6";
	wbCtx2.fillRect(24, 7, 2, 22);
	wbCtx2.fillStyle = "#ced4da";
	wbCtx2.fillRect(26, 6, 1, 24);
	wbCtx2.fillStyle = "#adb5bd";
	wbCtx2.fillRect(5, 6, 22, 1);
	wbCtx2.fillRect(5, 29, 22, 1);
	wbCtx2.fillRect(5, 6, 1, 24);
	wbCtx2.fillStyle = "#868e96";
	wbCtx2.fillRect(7, 6, 5, 2);
	wbCtx2.fillStyle = "#495057";
	wbCtx2.fillRect(7, 5, 1, 2);
	wbCtx2.fillRect(11, 5, 1, 2);
	wbCtx2.fillStyle = "#adb5bd";
	wbCtx2.fillRect(8, 7, 3, 1);
	wbCtx2.fillStyle = "#a5d8ff";
	wbCtx2.fillRect(6, 24, 20, 1);
	wbCtx2.fillStyle = "#74c0fc";
	wbCtx2.fillRect(6, 25, 20, 4);
	wb2.refresh();

	const rt = textures.createCanvas("reagent-table", 32, 32)!;
	const rtCtx = rt.context;
	rtCtx.fillStyle = "#f8f9fa";
	rtCtx.fillRect(0, 4, 32, 16);
	rtCtx.fillStyle = "#ffffff";
	rtCtx.fillRect(1, 4, 30, 2);
	rtCtx.fillStyle = "#dee2e6";
	rtCtx.fillRect(0, 3, 32, 1);
	rtCtx.fillStyle = "#e9ecef";
	rtCtx.fillRect(0, 6, 1, 14);
	rtCtx.fillRect(31, 6, 1, 14);
	rtCtx.fillStyle = "#ced4da";
	rtCtx.fillRect(2, 20, 3, 12);
	rtCtx.fillRect(27, 20, 3, 12);
	rtCtx.fillStyle = "#e9ecef";
	rtCtx.fillRect(3, 20, 1, 11);
	rtCtx.fillRect(28, 20, 1, 11);
	rtCtx.fillStyle = "#dee2e6";
	rtCtx.fillRect(0, 19, 32, 1);
	rtCtx.fillStyle = "#74c0fc";
	rtCtx.fillRect(6, 1, 3, 3);
	rtCtx.fillStyle = "#ffd43b";
	rtCtx.fillRect(12, 1, 3, 3);
	rtCtx.fillStyle = "#ff8787";
	rtCtx.fillRect(18, 1, 3, 3);
	rtCtx.fillStyle = "#69db7c";
	rtCtx.fillRect(24, 2, 3, 2);
	rt.refresh();

	const tb = textures.createCanvas("timbangan", 32, 32)!;
	const tbCtx = tb.context;
	tbCtx.fillStyle = "#e9ecef";
	tbCtx.fillRect(2, 20, 28, 10);
	tbCtx.fillStyle = "#f8f9fa";
	tbCtx.fillRect(3, 20, 26, 2);
	tbCtx.fillStyle = "#dee2e6";
	tbCtx.fillRect(8, 8, 16, 12);
	tbCtx.fillStyle = "#f1f3f5";
	tbCtx.fillRect(9, 9, 14, 10);
	tbCtx.fillStyle = "#212529";
	tbCtx.fillRect(11, 10, 10, 5);
	tbCtx.fillStyle = "#51cf66";
	tbCtx.fillRect(12, 11, 4, 3);
	tbCtx.fillStyle = "#adb5bd";
	tbCtx.fillRect(6, 6, 20, 2);
	tbCtx.fillStyle = "#ced4da";
	tbCtx.fillRect(8, 4, 16, 2);
	tbCtx.fillStyle = "#ced4da";
	tbCtx.fillRect(2, 30, 28, 1);
	tb.refresh();

	const fh = textures.createCanvas("fume-hood", 64, 64)!;
	const fhCtx = fh.context;
	fhCtx.fillStyle = "#6c757d";
	fhCtx.fillRect(0, 0, 64, 64);
	fhCtx.fillStyle = "#5c636a";
	fhCtx.fillRect(2, 2, 60, 60);
	fhCtx.fillStyle = "#868e96";
	fhCtx.fillRect(20, 0, 24, 4);
	fhCtx.fillStyle = "#495057";
	fhCtx.fillRect(24, 1, 2, 2);
	fhCtx.fillRect(30, 1, 2, 2);
	fhCtx.fillRect(36, 1, 2, 2);
	fhCtx.fillStyle = "#a5d8ff";
	fhCtx.fillRect(6, 6, 52, 28);
	fhCtx.fillStyle = "#d0ebff";
	fhCtx.fillRect(10, 10, 44, 20);
	fhCtx.fillStyle = "#e7f5ff";
	fhCtx.fillRect(12, 12, 2, 16);
	fhCtx.fillRect(16, 12, 1, 12);
	fhCtx.fillStyle = "#74c0fc";
	fhCtx.fillRect(14, 24, 36, 2);
	fhCtx.fillStyle = "#c3fae8";
	fhCtx.fillRect(26, 18, 6, 6);
	fhCtx.fillStyle = "#96f2d7";
	fhCtx.fillRect(27, 19, 4, 4);
	fhCtx.fillStyle = "#adb5bd";
	fhCtx.fillRect(26, 34, 12, 2);
	fhCtx.fillStyle = "#495057";
	fhCtx.fillRect(4, 38, 56, 22);
	fhCtx.fillStyle = "#adb5bd";
	fhCtx.fillRect(28, 48, 8, 3);
	fhCtx.fillStyle = "#343a40";
	fhCtx.fillRect(48, 40, 10, 8);
	fhCtx.fillStyle = "#69db7c";
	fhCtx.fillRect(50, 42, 3, 2);
	fhCtx.fillStyle = "#ff6b6b";
	fhCtx.fillRect(54, 42, 3, 2);
	fhCtx.fillStyle = "#868e96";
	fhCtx.fillRect(51, 45, 2, 2);
	fh.refresh();

	const wt = textures.createCanvas("weighing-table", 64, 32)!;
	const wtCtx = wt.context;
	wtCtx.fillStyle = "#dee2e6";
	wtCtx.fillRect(0, 4, 64, 28);
	wtCtx.fillStyle = "#e9ecef";
	wtCtx.fillRect(2, 4, 60, 8);
	wtCtx.fillStyle = "#f1f3f5";
	wtCtx.fillRect(4, 6, 56, 4);
	wtCtx.fillStyle = "#ced4da";
	wtCtx.fillRect(10, 7, 12, 1);
	wtCtx.fillRect(30, 8, 16, 1);
	wtCtx.fillStyle = "#adb5bd";
	wtCtx.fillRect(4, 28, 4, 4);
	wtCtx.fillRect(56, 28, 4, 4);
	wtCtx.fillStyle = "#868e96";
	wtCtx.fillRect(3, 30, 6, 2);
	wtCtx.fillRect(55, 30, 6, 2);
	wtCtx.fillStyle = "#a5d8ff";
	wtCtx.fillRect(20, 6, 24, 18);
	wtCtx.fillStyle = "#d0ebff";
	wtCtx.fillRect(24, 8, 16, 14);
	wtCtx.fillStyle = "#e7f5ff";
	wtCtx.fillRect(25, 9, 2, 10);
	wtCtx.fillStyle = "#f8f9fa";
	wtCtx.fillRect(28, 16, 8, 2);
	wtCtx.fillStyle = "#343a40";
	wtCtx.fillRect(28, 10, 8, 4);
	wtCtx.fillStyle = "#69db7c";
	wtCtx.fillRect(29, 11, 6, 2);
	wtCtx.fillStyle = "#868e96";
	wtCtx.fillRect(22, 22, 20, 4);
	wtCtx.fillStyle = "#ced4da";
	wtCtx.fillRect(0, 2, 64, 2);
	wt.refresh();

	const ov = textures.createCanvas("oven", 32, 32)!;
	const ovCtx = ov.context;
	ovCtx.fillStyle = "#868e96";
	ovCtx.fillRect(0, 0, 32, 32);
	ovCtx.fillStyle = "#6c757d";
	ovCtx.fillRect(2, 2, 28, 28);
	ovCtx.fillStyle = "#5c636a";
	ovCtx.fillRect(3, 3, 26, 6);
	ovCtx.fillStyle = "#343a40";
	ovCtx.fillRect(5, 4, 10, 4);
	ovCtx.fillStyle = "#69db7c";
	ovCtx.fillRect(6, 5, 8, 2);
	ovCtx.fillStyle = "#adb5bd";
	ovCtx.fillRect(18, 4, 4, 4);
	ovCtx.fillStyle = "#ced4da";
	ovCtx.fillRect(19, 5, 2, 2);
	ovCtx.fillStyle = "#69db7c";
	ovCtx.fillRect(24, 5, 2, 2);
	ovCtx.fillStyle = "#495057";
	ovCtx.fillRect(4, 10, 24, 18);
	ovCtx.fillStyle = "#3d4349";
	ovCtx.fillRect(6, 12, 20, 14);
	ovCtx.fillStyle = "#495057";
	ovCtx.fillRect(10, 14, 12, 8);
	ovCtx.fillStyle = "#adb5bd";
	ovCtx.fillRect(26, 14, 2, 8);
	ovCtx.fillStyle = "#5c636a";
	ovCtx.fillRect(8, 28, 4, 1);
	ovCtx.fillRect(14, 28, 4, 1);
	ovCtx.fillRect(20, 28, 4, 1);
	ov.refresh();

	const mf = textures.createCanvas("furnace", 32, 32)!;
	const mfCtx = mf.context;
	mfCtx.fillStyle = "#495057";
	mfCtx.fillRect(0, 0, 32, 32);
	mfCtx.fillStyle = "#3d4349";
	mfCtx.fillRect(2, 2, 28, 28);
	mfCtx.fillStyle = "#343a40";
	mfCtx.fillRect(3, 3, 26, 6);
	mfCtx.fillStyle = "#212529";
	mfCtx.fillRect(5, 4, 10, 4);
	mfCtx.fillStyle = "#ff6b6b";
	mfCtx.fillRect(6, 5, 8, 2);
	mfCtx.fillStyle = "#868e96";
	mfCtx.fillRect(18, 4, 4, 4);
	mfCtx.fillStyle = "#adb5bd";
	mfCtx.fillRect(19, 5, 2, 2);
	mfCtx.fillStyle = "#ff6b6b";
	mfCtx.fillRect(24, 5, 2, 2);
	mfCtx.fillStyle = "#343a40";
	mfCtx.fillRect(4, 10, 24, 18);
	mfCtx.fillStyle = "#2b2b2b";
	mfCtx.fillRect(6, 12, 20, 14);
	mfCtx.fillStyle = "#ff922b";
	mfCtx.fillRect(6, 17, 20, 4);
	mfCtx.fillStyle = "#ffd43b";
	mfCtx.fillRect(8, 18, 16, 2);
	mfCtx.fillStyle = "#fff3bf";
	mfCtx.fillRect(10, 18, 12, 1);
	mfCtx.fillStyle = "#adb5bd";
	mfCtx.fillRect(26, 14, 2, 2);
	mfCtx.fillRect(27, 12, 2, 2);
	mfCtx.fillStyle = "#868e96";
	mfCtx.fillRect(14, 26, 4, 2);
	mf.refresh();

	const hp = textures.createCanvas("hot-plate", 32, 32)!;
	const hpCtx = hp.context;
	hpCtx.fillStyle = "#e9ecef";
	hpCtx.fillRect(0, 0, 32, 32);
	hpCtx.fillStyle = "#f8f9fa";
	hpCtx.fillRect(2, 2, 28, 28);
	hpCtx.fillStyle = "#ff6b6b";
	hpCtx.fillRect(6, 6, 20, 20);
	hpCtx.fillStyle = "#f8f9fa";
	hpCtx.fillRect(8, 8, 16, 16);
	hpCtx.fillStyle = "#fa5252";
	hpCtx.fillRect(10, 10, 12, 12);
	hpCtx.fillStyle = "#f8f9fa";
	hpCtx.fillRect(12, 12, 8, 8);
	hpCtx.fillStyle = "#e03131";
	hpCtx.fillRect(13, 13, 6, 6);
	hpCtx.fillStyle = "#ff8787";
	hpCtx.fillRect(14, 14, 4, 4);
	hpCtx.fillStyle = "#ffc9c9";
	hpCtx.fillRect(15, 15, 2, 2);
	hpCtx.fillStyle = "#dee2e6";
	hpCtx.fillRect(4, 27, 8, 3);
	hpCtx.fillStyle = "#868e96";
	hpCtx.fillRect(6, 28, 4, 1);
	hpCtx.fillStyle = "#69db7c";
	hpCtx.fillRect(22, 28, 2, 2);
	hpCtx.fillStyle = "#ced4da";
	hpCtx.fillRect(0, 0, 32, 1);
	hpCtx.fillRect(0, 31, 32, 1);
	hpCtx.fillRect(0, 0, 1, 32);
	hpCtx.fillRect(31, 0, 1, 32);
	hp.refresh();

	const ds = textures.createCanvas("desiccator", 32, 32)!;
	const dsCtx = ds.context;
	dsCtx.fillStyle = "#dee2e6";
	dsCtx.fillRect(4, 24, 24, 8);
	dsCtx.fillStyle = "#ced4da";
	dsCtx.fillRect(6, 26, 20, 4);
	dsCtx.fillStyle = "#868e96";
	dsCtx.fillRect(5, 22, 22, 2);
	dsCtx.fillStyle = "#a5d8ff";
	dsCtx.fillRect(6, 4, 20, 18);
	dsCtx.fillStyle = "#d0ebff";
	dsCtx.fillRect(8, 6, 16, 14);
	dsCtx.fillStyle = "#e7f5ff";
	dsCtx.fillRect(9, 7, 2, 10);
	dsCtx.fillRect(13, 7, 1, 8);
	dsCtx.fillStyle = "#339af0";
	dsCtx.fillRect(10, 12, 3, 3);
	dsCtx.fillRect(17, 11, 3, 3);
	dsCtx.fillRect(13, 16, 3, 3);
	dsCtx.fillStyle = "#f06595";
	dsCtx.fillRect(20, 15, 2, 2);
	dsCtx.fillRect(10, 17, 2, 2);
	dsCtx.fillStyle = "#f8f9fa";
	dsCtx.fillRect(14, 8, 4, 4);
	dsCtx.fillStyle = "#e9ecef";
	dsCtx.fillRect(15, 9, 2, 2);
	dsCtx.fillStyle = "#868e96";
	dsCtx.fillRect(14, 2, 4, 3);
	dsCtx.fillStyle = "#adb5bd";
	dsCtx.fillRect(15, 3, 2, 1);
	ds.refresh();

	const cab = textures.createCanvas("cabinet", 32, 64)!;
	const cabCtx = cab.context;
	cabCtx.fillStyle = "#7a6244";
	cabCtx.fillRect(0, 0, 32, 64);
	cabCtx.fillStyle = "#8b7355";
	cabCtx.fillRect(2, 2, 28, 60);
	cabCtx.fillStyle = "#6b5535";
	cabCtx.fillRect(4, 4, 24, 26);
	cabCtx.fillStyle = "#7a6244";
	cabCtx.fillRect(8, 8, 16, 1);
	cabCtx.fillRect(6, 14, 18, 1);
	cabCtx.fillRect(10, 20, 12, 1);
	cabCtx.fillStyle = "#adb5bd";
	cabCtx.fillRect(14, 24, 4, 3);
	cabCtx.fillStyle = "#5c4a32";
	cabCtx.fillRect(2, 32, 28, 2);
	cabCtx.fillStyle = "#6b5535";
	cabCtx.fillRect(4, 36, 24, 24);
	cabCtx.fillStyle = "#7a6244";
	cabCtx.fillRect(8, 40, 14, 1);
	cabCtx.fillRect(6, 48, 18, 1);
	cabCtx.fillStyle = "#adb5bd";
	cabCtx.fillRect(14, 54, 4, 3);
	cabCtx.fillStyle = "#f8f9fa";
	cabCtx.fillRect(10, 8, 12, 4);
	cabCtx.fillStyle = "#dee2e6";
	cabCtx.fillRect(11, 9, 10, 2);
	cabCtx.fillStyle = "#5c4a32";
	cabCtx.fillRect(0, 0, 32, 2);
	cabCtx.fillRect(0, 62, 32, 2);
	cab.refresh();

	const ss = textures.createCanvas("sink-station", 32, 32)!;
	const ssCtx = ss.context;
	ssCtx.fillStyle = "#adb5bd";
	ssCtx.fillRect(0, 0, 32, 32);
	ssCtx.fillStyle = "#ced4da";
	ssCtx.fillRect(2, 2, 28, 28);
	ssCtx.fillStyle = "#dee2e6";
	ssCtx.fillRect(3, 3, 26, 2);
	ssCtx.fillStyle = "#868e96";
	ssCtx.fillRect(6, 6, 20, 20);
	ssCtx.fillStyle = "#6c757d";
	ssCtx.fillRect(8, 8, 16, 16);
	ssCtx.fillStyle = "#74c0fc";
	ssCtx.fillRect(10, 10, 12, 12);
	ssCtx.fillStyle = "#a5d8ff";
	ssCtx.fillRect(12, 12, 6, 6);
	ssCtx.fillStyle = "#495057";
	ssCtx.fillRect(14, 2, 4, 6);
	ssCtx.fillStyle = "#6c757d";
	ssCtx.fillRect(15, 3, 2, 4);
	ssCtx.fillStyle = "#339af0";
	ssCtx.fillRect(11, 4, 2, 2);
	ssCtx.fillStyle = "#e03131";
	ssCtx.fillRect(19, 4, 2, 2);
	ssCtx.fillStyle = "#495057";
	ssCtx.fillRect(15, 15, 2, 2);
	ssCtx.fillStyle = "#6c757d";
	ssCtx.fillRect(0, 0, 32, 1);
	ssCtx.fillRect(0, 31, 32, 1);
	ssCtx.fillRect(0, 0, 1, 32);
	ssCtx.fillRect(31, 0, 1, 32);
	ss.refresh();

	const se = textures.createCanvas("safety-equip", 32, 32)!;
	const seCtx = se.context;
	seCtx.fillStyle = "#e03131";
	seCtx.fillRect(4, 2, 24, 28);
	seCtx.fillStyle = "#c92a2a";
	seCtx.fillRect(6, 4, 20, 24);
	seCtx.fillStyle = "#f8f9fa";
	seCtx.fillRect(12, 7, 8, 18);
	seCtx.fillRect(8, 12, 16, 8);
	seCtx.fillStyle = "#e9ecef";
	seCtx.fillRect(13, 8, 6, 16);
	seCtx.fillRect(9, 13, 14, 6);
	seCtx.fillStyle = "#a5110a";
	seCtx.fillRect(4, 1, 24, 1);
	seCtx.fillRect(4, 30, 24, 1);
	seCtx.fillRect(3, 2, 1, 28);
	seCtx.fillRect(28, 2, 1, 28);
	seCtx.fillStyle = "#868e96";
	seCtx.fillRect(10, 1, 4, 2);
	seCtx.fillRect(18, 1, 4, 2);
	se.refresh();

	const es = textures.createCanvas("emergency-shower", 32, 32)!;
	const esCtx = es.context;
	esCtx.fillStyle = "#ffd43b";
	esCtx.fillRect(6, 0, 20, 32);
	esCtx.fillStyle = "#fab005";
	esCtx.fillRect(8, 2, 16, 28);
	esCtx.fillStyle = "#868e96";
	esCtx.fillRect(10, 3, 12, 6);
	esCtx.fillStyle = "#adb5bd";
	esCtx.fillRect(12, 4, 8, 4);
	esCtx.fillStyle = "#74c0fc";
	esCtx.fillRect(11, 10, 2, 3);
	esCtx.fillRect(15, 11, 2, 3);
	esCtx.fillRect(19, 10, 2, 3);
	esCtx.fillStyle = "#a5d8ff";
	esCtx.fillRect(13, 12, 1, 2);
	esCtx.fillRect(17, 11, 1, 2);
	esCtx.fillStyle = "#6c757d";
	esCtx.fillRect(15, 0, 2, 4);
	esCtx.fillStyle = "#e03131";
	esCtx.fillRect(11, 22, 10, 6);
	esCtx.fillStyle = "#c92a2a";
	esCtx.fillRect(13, 24, 6, 2);
	esCtx.fillStyle = "#f8f9fa";
	esCtx.fillRect(10, 16, 12, 4);
	esCtx.fillStyle = "#e03131";
	esCtx.fillRect(11, 17, 10, 2);
	es.refresh();

	const dr = textures.createCanvas("door", 32, 32)!;
	const drCtx = dr.context;
	drCtx.fillStyle = "#7a6244";
	drCtx.fillRect(0, 0, 32, 32);
	drCtx.fillStyle = "#8b7355";
	drCtx.fillRect(2, 2, 28, 28);
	drCtx.fillStyle = "#6b5535";
	drCtx.fillRect(6, 4, 20, 10);
	drCtx.fillRect(6, 18, 20, 10);
	drCtx.fillStyle = "#7a6244";
	drCtx.fillRect(8, 6, 14, 1);
	drCtx.fillRect(10, 20, 12, 1);
	drCtx.fillRect(8, 24, 14, 1);
	drCtx.fillStyle = "#ffd43b";
	drCtx.fillRect(22, 14, 4, 4);
	drCtx.fillStyle = "#fab005";
	drCtx.fillRect(23, 15, 2, 2);
	drCtx.fillStyle = "#495057";
	drCtx.fillRect(24, 19, 1, 2);
	dr.refresh();

	const gc = textures.createCanvas("glassware-cabinet", 32, 64)!;
	const gcCtx = gc.context;
	gcCtx.fillStyle = "#495057";
	gcCtx.fillRect(0, 0, 32, 64);
	gcCtx.fillStyle = "#5c636a";
	gcCtx.fillRect(2, 2, 28, 60);
	gcCtx.fillStyle = "#a5d8ff";
	gcCtx.fillRect(4, 4, 24, 26);
	gcCtx.fillStyle = "#d0ebff";
	gcCtx.fillRect(6, 6, 20, 22);
	gcCtx.fillStyle = "#e7f5ff";
	gcCtx.fillRect(7, 7, 2, 18);
	gcCtx.fillStyle = "#74c0fc";
	gcCtx.fillRect(10, 10, 4, 10);
	gcCtx.fillStyle = "#a5d8ff";
	gcCtx.fillRect(11, 11, 2, 8);
	gcCtx.fillStyle = "#74c0fc";
	gcCtx.fillRect(17, 8, 6, 12);
	gcCtx.fillRect(19, 6, 2, 2);
	gcCtx.fillStyle = "#a5d8ff";
	gcCtx.fillRect(18, 9, 4, 10);
	gcCtx.fillStyle = "#adb5bd";
	gcCtx.fillRect(14, 24, 4, 3);
	gcCtx.fillStyle = "#3d4349";
	gcCtx.fillRect(2, 32, 28, 2);
	gcCtx.fillStyle = "#a5d8ff";
	gcCtx.fillRect(4, 36, 24, 24);
	gcCtx.fillStyle = "#d0ebff";
	gcCtx.fillRect(6, 38, 20, 20);
	gcCtx.fillStyle = "#e7f5ff";
	gcCtx.fillRect(7, 39, 2, 16);
	gcCtx.fillStyle = "#74c0fc";
	gcCtx.fillRect(10, 40, 3, 14);
	gcCtx.fillStyle = "#a5d8ff";
	gcCtx.fillRect(11, 41, 1, 12);
	gcCtx.fillStyle = "#74c0fc";
	gcCtx.fillRect(17, 39, 2, 14);
	gcCtx.fillRect(20, 39, 2, 14);
	gcCtx.fillRect(23, 39, 2, 14);
	gcCtx.fillStyle = "#ffd43b";
	gcCtx.fillRect(17, 46, 2, 6);
	gcCtx.fillStyle = "#69db7c";
	gcCtx.fillRect(20, 44, 2, 8);
	gcCtx.fillStyle = "#ff6b6b";
	gcCtx.fillRect(23, 48, 2, 4);
	gcCtx.fillStyle = "#adb5bd";
	gcCtx.fillRect(14, 56, 4, 3);
	gc.refresh();

	const rb = textures.createCanvas("reagent-bottle", 32, 32)!;
	const rbCtx = rb.context;
	rbCtx.fillStyle = "#e9ecef";
	rbCtx.fillRect(10, 8, 12, 20);
	rbCtx.fillStyle = "#dee2e6";
	rbCtx.fillRect(12, 10, 8, 16);
	rbCtx.fillStyle = "#ced4da";
	rbCtx.fillRect(13, 4, 6, 4);
	rbCtx.fillStyle = "#495057";
	rbCtx.fillRect(12, 2, 8, 3);
	rbCtx.fillStyle = "#74c0fc";
	rbCtx.fillRect(12, 14, 8, 12);
	rbCtx.fillStyle = "#f8f9fa";
	rbCtx.fillRect(11, 18, 10, 6);
	rbCtx.fillStyle = "#343a40";
	rbCtx.fillRect(13, 20, 6, 2);
	rbCtx.fillStyle = "#f8f9fa";
	rbCtx.fillRect(11, 10, 1, 8);
	rb.refresh();

	const fs = textures.createCanvas("filtration-setup", 64, 64)!;
	const fsCtx = fs.context;
	fsCtx.fillStyle = "#495057";
	fsCtx.fillRect(8, 56, 48, 4);
	fsCtx.fillStyle = "#6c757d";
	fsCtx.fillRect(30, 8, 4, 48);
	fsCtx.fillStyle = "#868e96";
	fsCtx.fillRect(18, 20, 14, 3);
	fsCtx.fillStyle = "#d0ebff";
	fsCtx.fillRect(14, 12, 24, 3);
	fsCtx.fillRect(16, 15, 20, 3);
	fsCtx.fillRect(18, 18, 16, 2);
	fsCtx.fillStyle = "#a5d8ff";
	fsCtx.fillRect(20, 20, 12, 4);
	fsCtx.fillStyle = "#d0ebff";
	fsCtx.fillRect(24, 24, 4, 10);
	fsCtx.fillStyle = "#f8f9fa";
	fsCtx.fillRect(18, 14, 16, 2);
	fsCtx.fillRect(20, 16, 12, 2);
	fsCtx.fillRect(22, 18, 8, 2);
	fsCtx.fillStyle = "#e9ecef";
	fsCtx.fillRect(16, 36, 20, 18);
	fsCtx.fillStyle = "#dee2e6";
	fsCtx.fillRect(18, 38, 16, 14);
	fsCtx.fillStyle = "#74c0fc";
	fsCtx.fillRect(18, 44, 16, 8);
	fs.refresh();

	const tr = textures.createCanvas("test-tube-rack", 32, 32)!;
	const trCtx = tr.context;
	trCtx.fillStyle = "#7a6244";
	trCtx.fillRect(2, 20, 28, 4);
	trCtx.fillRect(2, 10, 28, 3);
	trCtx.fillRect(4, 24, 3, 6);
	trCtx.fillRect(25, 24, 3, 6);
	trCtx.fillStyle = "#d0ebff";
	trCtx.fillRect(6, 4, 3, 20);
	trCtx.fillRect(11, 4, 3, 20);
	trCtx.fillRect(16, 4, 3, 20);
	trCtx.fillRect(21, 4, 3, 20);
	trCtx.fillStyle = "#74c0fc";
	trCtx.fillRect(6, 14, 3, 10);
	trCtx.fillStyle = "#ffd43b";
	trCtx.fillRect(11, 16, 3, 8);
	trCtx.fillStyle = "#69db7c";
	trCtx.fillRect(16, 12, 3, 12);
	trCtx.fillStyle = "#ff6b6b";
	trCtx.fillRect(21, 15, 3, 9);
	tr.refresh();

	const cr = textures.createCanvas("crucible", 32, 32)!;
	const crCtx = cr.context;
	crCtx.fillStyle = "#dee2e6";
	crCtx.fillRect(8, 10, 16, 16);
	crCtx.fillStyle = "#ced4da";
	crCtx.fillRect(10, 12, 12, 12);
	crCtx.fillStyle = "#e9ecef";
	crCtx.fillRect(6, 8, 20, 3);
	crCtx.fillStyle = "#adb5bd";
	crCtx.fillRect(10, 26, 12, 2);
	crCtx.fillRect(12, 28, 8, 2);
	crCtx.fillStyle = "#868e96";
	crCtx.fillRect(8, 4, 16, 4);
	crCtx.fillStyle = "#adb5bd";
	crCtx.fillRect(14, 2, 4, 3);
	cr.refresh();

	const dw = textures.createCanvas("distilled-water", 32, 32)!;
	const dwCtx = dw.context;
	dwCtx.fillStyle = "#d0ebff";
	dwCtx.fillRect(6, 10, 20, 18);
	dwCtx.fillStyle = "#a5d8ff";
	dwCtx.fillRect(8, 12, 16, 14);
	dwCtx.fillStyle = "#d0ebff";
	dwCtx.fillRect(12, 4, 8, 6);
	dwCtx.fillStyle = "#228be6";
	dwCtx.fillRect(11, 2, 10, 3);
	dwCtx.fillStyle = "#74c0fc";
	dwCtx.fillRect(8, 16, 16, 10);
	dwCtx.fillStyle = "#e7f5ff";
	dwCtx.fillRect(9, 12, 2, 10);
	dwCtx.fillStyle = "#f8f9fa";
	dwCtx.fillRect(10, 20, 12, 4);
	dwCtx.fillStyle = "#228be6";
	dwCtx.fillRect(12, 21, 8, 2);
	dwCtx.fillStyle = "#adb5bd";
	dwCtx.fillRect(6, 28, 20, 2);
	dw.refresh();

	const lk = textures.createCanvas("lakmus-paper", 32, 32)!;
	const lkCtx = lk.context;
	lkCtx.fillStyle = "#f8f9fa";
	lkCtx.fillRect(4, 12, 24, 16);
	lkCtx.fillStyle = "#e9ecef";
	lkCtx.fillRect(6, 14, 20, 12);
	lkCtx.fillStyle = "#e03131";
	lkCtx.fillRect(8, 4, 3, 12);
	lkCtx.fillRect(13, 6, 3, 10);
	lkCtx.fillRect(18, 5, 3, 11);
	lkCtx.fillRect(23, 7, 3, 9);
	lkCtx.fillStyle = "#343a40";
	lkCtx.fillRect(12, 20, 8, 2);
	lk.refresh();

	const pg = textures.createCanvas("piala-gelas", 32, 32)!;
	const pgCtx = pg.context;
	pgCtx.fillStyle = "#d0ebff";
	pgCtx.fillRect(6, 6, 20, 22);
	pgCtx.fillStyle = "#e7f5ff";
	pgCtx.fillRect(8, 8, 16, 18);
	pgCtx.fillStyle = "#d0ebff";
	pgCtx.fillRect(4, 6, 4, 3);
	pgCtx.fillStyle = "#adb5bd";
	pgCtx.fillRect(22, 12, 3, 1);
	pgCtx.fillRect(22, 16, 3, 1);
	pgCtx.fillRect(22, 20, 3, 1);
	pgCtx.fillStyle = "#4dabf7";
	pgCtx.fillRect(8, 14, 16, 12);
	pgCtx.fillStyle = "#f8f9fa";
	pgCtx.fillRect(9, 8, 1, 10);
	pgCtx.fillStyle = "#adb5bd";
	pgCtx.fillRect(6, 28, 20, 2);
	pg.refresh();
}

// ── Character drawing (copied from BootScene.ts) ───────────────────────

interface CharColors {
	skin: number;
	skinShade: number;
	hair: number;
	hairShade: number;
	coat: number;
	coatShade: number;
	shirt: number;
	pants: number;
	shoes: number;
	eyes: number;
}

type PxFn = (color: number, x: number, y: number, w?: number, h?: number) => void;

function drawDown(px: PxFn, c: CharColors, frame: "idle" | "walkA" | "walkB") {
	px(c.hair, 11, 2, 10, 1);
	px(c.hair, 10, 3, 12, 2);
	px(c.hair, 9, 5, 14, 3);
	px(c.hairShade, 12, 3, 6, 1);
	px(c.hairShade, 10, 5, 8, 1);

	px(c.skin, 10, 8, 12, 8);
	px(c.skin, 11, 16, 10, 1);
	px(c.skinShade, 11, 15, 10, 1);
	px(c.skin, 8, 10, 2, 3);
	px(c.skinShade, 8, 12, 2, 1);
	px(c.skin, 22, 10, 2, 3);
	px(c.skinShade, 22, 12, 2, 1);
	px(c.hairShade, 9, 8, 1, 8);
	px(c.hairShade, 22, 8, 1, 8);
	px(c.hairShade, 11, 17, 10, 1);
	px(c.hairShade, 10, 16, 1, 1);
	px(c.hairShade, 21, 16, 1, 1);

	px(c.eyes, 12, 11, 2, 2);
	px(c.eyes, 18, 11, 2, 2);
	px(0xffffff, 12, 11, 1, 1);
	px(0xffffff, 18, 11, 1, 1);

	px(c.skinShade, 15, 13, 2, 1);
	px(c.skinShade, 14, 14, 4, 1);

	px(c.skin, 14, 17, 4, 1);

	px(c.coat, 11, 18, 10, 6);
	px(c.coatShade, 11, 18, 1, 6);
	px(c.coatShade, 20, 18, 1, 6);
	px(c.coatShade, 11, 23, 10, 1);
	px(c.shirt, 14, 18, 4, 3);
	px(c.coatShade, 13, 20, 1, 1);
	px(c.coatShade, 18, 20, 1, 1);

	if (frame === "idle") {
		px(c.coat, 9, 18, 2, 5);
		px(c.skin, 9, 23, 2, 1);
		px(c.coat, 21, 18, 2, 5);
		px(c.skin, 21, 23, 2, 1);
		px(c.pants, 12, 24, 3, 4);
		px(c.pants, 17, 24, 3, 4);
		px(c.shoes, 12, 28, 3, 3);
		px(c.shoes, 17, 28, 3, 3);
	} else if (frame === "walkA") {
		px(c.coat, 9, 17, 2, 5);
		px(c.skin, 9, 22, 2, 1);
		px(c.coat, 21, 19, 2, 5);
		px(c.skin, 21, 24, 2, 1);
		px(c.pants, 11, 24, 3, 4);
		px(c.shoes, 11, 28, 3, 3);
		px(c.pants, 18, 24, 3, 3);
		px(c.shoes, 18, 27, 3, 3);
	} else {
		px(c.coat, 21, 17, 2, 5);
		px(c.skin, 21, 22, 2, 1);
		px(c.coat, 9, 19, 2, 5);
		px(c.skin, 9, 24, 2, 1);
		px(c.pants, 18, 24, 3, 4);
		px(c.shoes, 18, 28, 3, 3);
		px(c.pants, 11, 24, 3, 3);
		px(c.shoes, 11, 27, 3, 3);
	}
}

function drawUp(px: PxFn, c: CharColors, frame: "idle" | "walkA" | "walkB") {
	px(c.hair, 11, 2, 10, 1);
	px(c.hair, 10, 3, 12, 2);
	px(c.hair, 9, 5, 14, 12);
	px(c.hairShade, 12, 3, 6, 1);
	px(c.hairShade, 10, 6, 10, 1);
	px(c.hairShade, 11, 10, 8, 1);
	px(c.hairShade, 9, 8, 1, 8);
	px(c.hairShade, 22, 8, 1, 8);
	px(c.hairShade, 11, 17, 10, 1);
	px(c.hairShade, 10, 16, 1, 1);
	px(c.hairShade, 21, 16, 1, 1);

	px(c.skin, 14, 17, 4, 1);

	px(c.coat, 11, 18, 10, 6);
	px(c.coatShade, 11, 18, 1, 6);
	px(c.coatShade, 20, 18, 1, 6);
	px(c.coatShade, 11, 23, 10, 1);
	px(c.coatShade, 15, 19, 2, 3);

	if (frame === "idle") {
		px(c.coat, 9, 18, 2, 5);
		px(c.skin, 9, 23, 2, 1);
		px(c.coat, 21, 18, 2, 5);
		px(c.skin, 21, 23, 2, 1);
		px(c.pants, 12, 24, 3, 4);
		px(c.pants, 17, 24, 3, 4);
		px(c.shoes, 12, 28, 3, 3);
		px(c.shoes, 17, 28, 3, 3);
	} else if (frame === "walkA") {
		px(c.coat, 9, 17, 2, 5);
		px(c.skin, 9, 22, 2, 1);
		px(c.coat, 21, 19, 2, 5);
		px(c.skin, 21, 24, 2, 1);
		px(c.pants, 11, 24, 3, 4);
		px(c.shoes, 11, 28, 3, 3);
		px(c.pants, 18, 24, 3, 3);
		px(c.shoes, 18, 27, 3, 3);
	} else {
		px(c.coat, 21, 17, 2, 5);
		px(c.skin, 21, 22, 2, 1);
		px(c.coat, 9, 19, 2, 5);
		px(c.skin, 9, 24, 2, 1);
		px(c.pants, 18, 24, 3, 4);
		px(c.shoes, 18, 28, 3, 3);
		px(c.pants, 11, 24, 3, 3);
		px(c.shoes, 11, 27, 3, 3);
	}
}

function drawLeft(px: PxFn, c: CharColors, frame: "idle" | "walkA" | "walkB") {
	px(c.hair, 11, 2, 10, 1);
	px(c.hair, 10, 3, 12, 2);
	px(c.hair, 9, 5, 13, 3);
	px(c.hairShade, 12, 3, 6, 1);
	px(c.hairShade, 10, 5, 6, 1);

	px(c.skin, 10, 8, 12, 8);
	px(c.skin, 11, 16, 10, 1);
	px(c.skinShade, 11, 15, 10, 1);
	px(c.skin, 22, 10, 2, 3);
	px(c.skinShade, 22, 12, 2, 1);
	px(c.hairShade, 9, 8, 1, 8);
	px(c.hairShade, 22, 8, 1, 8);
	px(c.hairShade, 11, 17, 10, 1);
	px(c.hairShade, 10, 16, 1, 1);
	px(c.hairShade, 21, 16, 1, 1);

	px(c.eyes, 12, 11, 2, 2);
	px(0xffffff, 12, 11, 1, 1);

	px(c.skinShade, 10, 13, 1, 1);
	px(c.skinShade, 11, 14, 3, 1);

	px(c.skin, 14, 17, 4, 1);

	px(c.coat, 11, 18, 10, 6);
	px(c.coatShade, 11, 18, 1, 6);
	px(c.coatShade, 20, 18, 1, 6);
	px(c.coatShade, 11, 23, 10, 1);
	px(c.shirt, 12, 18, 3, 3);

	if (frame === "idle") {
		px(c.coat, 9, 18, 2, 5);
		px(c.skin, 9, 23, 2, 1);
		px(c.pants, 12, 24, 3, 4);
		px(c.pants, 16, 24, 3, 4);
		px(c.shoes, 12, 28, 3, 3);
		px(c.shoes, 16, 28, 3, 3);
	} else if (frame === "walkA") {
		px(c.coat, 9, 17, 2, 5);
		px(c.skin, 9, 22, 2, 1);
		px(c.pants, 10, 24, 3, 4);
		px(c.shoes, 10, 28, 3, 3);
		px(c.pants, 17, 24, 3, 3);
		px(c.shoes, 17, 27, 3, 3);
	} else {
		px(c.coat, 9, 19, 2, 5);
		px(c.skin, 9, 24, 2, 1);
		px(c.pants, 15, 24, 3, 4);
		px(c.shoes, 15, 28, 3, 3);
		px(c.pants, 12, 24, 3, 3);
		px(c.shoes, 12, 27, 3, 3);
	}
}

function drawRight(px: PxFn, c: CharColors, frame: "idle" | "walkA" | "walkB") {
	const mpx: PxFn = (color, x, y, w = 1, h = 1) => {
		px(color, 31 - x - w + 1, y, w, h);
	};

	mpx(c.hair, 11, 2, 10, 1);
	mpx(c.hair, 10, 3, 12, 2);
	mpx(c.hair, 9, 5, 13, 3);
	mpx(c.hairShade, 12, 3, 6, 1);
	mpx(c.hairShade, 10, 5, 6, 1);

	mpx(c.skin, 10, 8, 12, 8);
	mpx(c.skin, 11, 16, 10, 1);
	mpx(c.skinShade, 11, 15, 10, 1);
	mpx(c.skin, 22, 10, 2, 3);
	mpx(c.skinShade, 22, 12, 2, 1);
	mpx(c.hairShade, 9, 8, 1, 8);
	mpx(c.hairShade, 22, 8, 1, 8);
	mpx(c.hairShade, 11, 17, 10, 1);
	mpx(c.hairShade, 10, 16, 1, 1);
	mpx(c.hairShade, 21, 16, 1, 1);

	mpx(c.eyes, 12, 11, 2, 2);
	mpx(0xffffff, 12, 11, 1, 1);

	mpx(c.skinShade, 10, 13, 1, 1);
	mpx(c.skinShade, 11, 14, 3, 1);

	mpx(c.skin, 14, 17, 4, 1);

	mpx(c.coat, 11, 18, 10, 6);
	mpx(c.coatShade, 11, 18, 1, 6);
	mpx(c.coatShade, 20, 18, 1, 6);
	mpx(c.coatShade, 11, 23, 10, 1);
	mpx(c.shirt, 12, 18, 3, 3);

	if (frame === "idle") {
		mpx(c.coat, 9, 18, 2, 5);
		mpx(c.skin, 9, 23, 2, 1);
		mpx(c.pants, 12, 24, 3, 4);
		mpx(c.pants, 16, 24, 3, 4);
		mpx(c.shoes, 12, 28, 3, 3);
		mpx(c.shoes, 16, 28, 3, 3);
	} else if (frame === "walkA") {
		mpx(c.coat, 9, 17, 2, 5);
		mpx(c.skin, 9, 22, 2, 1);
		mpx(c.pants, 10, 24, 3, 4);
		mpx(c.shoes, 10, 28, 3, 3);
		mpx(c.pants, 17, 24, 3, 3);
		mpx(c.shoes, 17, 27, 3, 3);
	} else {
		mpx(c.coat, 9, 19, 2, 5);
		mpx(c.skin, 9, 24, 2, 1);
		mpx(c.pants, 15, 24, 3, 4);
		mpx(c.shoes, 15, 28, 3, 3);
		mpx(c.pants, 12, 24, 3, 3);
		mpx(c.shoes, 12, 27, 3, 3);
	}
}

interface CharSheet {
	key: string;
	width: number;
	height: number;
	// rects on the full spritesheet (96×128), each tagged with col/row
	rects: { x: number; y: number; w: number; h: number; color: string }[];
}

function generateCharacter(key: string, c: CharColors): CharSheet {
	const rects: CharSheet["rects"] = [];
	const hex = (color: number) =>
		`#${color.toString(16).padStart(6, "0")}`;

	const makePx =
		(col: number, row: number): PxFn =>
		(color, x, y, w = 1, h = 1) => {
			rects.push({
				x: col * 32 + x,
				y: row * 32 + y,
				w,
				h,
				color: hex(color),
			});
		};

	drawDown(makePx(0, 0), c, "idle");
	drawDown(makePx(1, 0), c, "walkA");
	drawDown(makePx(2, 0), c, "walkB");
	drawUp(makePx(0, 1), c, "idle");
	drawUp(makePx(1, 1), c, "walkA");
	drawUp(makePx(2, 1), c, "walkB");
	drawLeft(makePx(0, 2), c, "idle");
	drawLeft(makePx(1, 2), c, "walkA");
	drawLeft(makePx(2, 2), c, "walkB");
	drawRight(makePx(0, 3), c, "idle");
	drawRight(makePx(1, 3), c, "walkA");
	drawRight(makePx(2, 3), c, "walkB");

	return { key, width: 96, height: 128, rects };
}

// ── Main ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outDir = resolve(__dirname, "../assets/sprites");
mkdirSync(outDir, { recursive: true });

generateTiles();
generateLabEquipment();

const playerColors: CharColors = {
	skin: 0xffd8a8,
	skinShade: 0xf0c090,
	hair: 0x4a3728,
	hairShade: 0x362818,
	coat: 0xf8f9fa,
	coatShade: 0xdee2e6,
	shirt: 0x4dabf7,
	pants: 0x495057,
	shoes: 0x343a40,
	eyes: 0x2b2b2b,
};

const remoteColors: CharColors = {
	skin: 0xffd8a8,
	skinShade: 0xf0c090,
	hair: 0x862e0b,
	hairShade: 0x6a2108,
	coat: 0xd0ebff,
	coatShade: 0xa5d8ff,
	shirt: 0x69db7c,
	pants: 0x5c636a,
	shoes: 0x343a40,
	eyes: 0x2b2b2b,
};

const charSheets: CharSheet[] = [
	generateCharacter("player", playerColors),
	generateCharacter("remote-player", remoteColors),
];

let totalWritten = 0;

for (const sprite of sprites) {
	const svg = rectsToSvg(sprite.width, sprite.height, sprite.rects);
	writeFileSync(resolve(outDir, `${sprite.key}.svg`), svg);
	totalWritten++;
}

const dirNames = ["down", "up", "left", "right"];
const frameNames = ["idle", "walkA", "walkB"];

for (const sheet of charSheets) {
	// Full spritesheet.
	const sheetSvg = rectsToSvg(sheet.width, sheet.height, sheet.rects);
	writeFileSync(resolve(outDir, `${sheet.key}.svg`), sheetSvg);
	totalWritten++;

	// Per-frame slices (32×32 each, rects offset back to origin).
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 3; col++) {
			const ox = col * 32;
			const oy = row * 32;
			const frameRects = sheet.rects
				.filter(
					(r) =>
						r.x >= ox && r.x < ox + 32 && r.y >= oy && r.y < oy + 32,
				)
				.map((r) => ({ ...r, x: r.x - ox, y: r.y - oy }));
			const frameSvg = rectsToSvg(32, 32, frameRects);
			const name = `${sheet.key}-${dirNames[row]}-${frameNames[col]}.svg`;
			writeFileSync(resolve(outDir, name), frameSvg);
			totalWritten++;
		}
	}
}

console.log(`Wrote ${totalWritten} SVG files to ${outDir}`);
