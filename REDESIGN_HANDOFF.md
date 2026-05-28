# REDESIGN HANDOFF — thesis-lab UI Overhaul (Stardew-style)

> Doc ini ditulis dari sesi Claude lain (folder skripsi) untuk sesi Claude yang
> jalan **di folder app ini** (`~/Documents/Project/CHEMIST/thesis-lab`).
> Baca penuh sebelum mulai. Semua komunikasi & dokumentasi pakai Bahasa Indonesia.

## 🎯 Tujuan

Full redesign UI aplikasi lab kimia virtual ini supaya **lebih oke**, dengan acuan
estetika **game Stardew Valley** (cozy, pixel/painterly, panel kayu, palet earthy).
Lalu **dokumentasikan hasil redesign-nya di Figma dengan rapi**.

Dua hal yang dipisah jelas:
1. **Redesign di kode** (React/Next.js + Phaser) — deliverable utama app.
2. **Dokumentasi rapi di Figma** — board "Redesign v2": frame per screen + komponen + anotasi.

## 🚫 Constraint penting

- **KEEP sprites existing.** Semua aset di `packages/lab-app/assets/sprites/*.svg`
  (player directional, alat lab: furnace, hot-plate, fume-hood, cabinet, timbangan,
  sink-station, dll, tile floor/wall 0–15, map.svg) **dipertahankan** — jangan diganti.
  Redesign menyasar **UI chrome / HUD / panel / overlay**, bukan sprite in-world.
- Jangan paraphrase/utak-atik logika game tanpa alasan; ini overhaul **visual/UX**.

## 🧩 Peta aplikasi (monorepo bun + workspaces)

- `packages/lab-app` — Next.js (App Router) + Phaser frontend ← **fokus redesign**
- `packages/lab-server` — Cloudflare Worker + Durable Object backend
- `packages/shared` — Zod schemas / protocol types

### lab-app yang relevan untuk redesign
```
src/app/
  page.tsx                  landing / entry
  room/[roomId]/page.tsx    halaman game room
  layout.tsx, globals.css
src/styles/
  colors.css                ← token warna (titik mulai design system)
  fonts.css                 ← token font
src/components/
  LobbyView.tsx             lobby
  GameCanvas.tsx / GameView.tsx   host Phaser
  ChatOverlay.tsx           chat
  InteractButton.tsx        tombol interaksi
  VirtualJoystick.tsx       kontrol mobile
  LevelOverlay.tsx          overlay level
  ObjectSheet.tsx           sheet objek
  ProcessProgress.tsx       progress prosedur        ← prioritas (lihat bawah)
  workbench/WorkbenchSheet.tsx (+ logic.ts)          ← prioritas
  ConceptFeedbackModal.tsx / GuidedConceptCheckModal.tsx  feedback ← prioritas
  ReportPanel.tsx           laporan                  ← prioritas
  ui/ChemButton.tsx, ui/ChemistLogomark.tsx          komponen UI dasar
src/game/scenes/
  BootScene.ts, LabScene.ts, UIScene.ts   ← UIScene = HUD dalam Phaser
```

## 🔬 Prioritas redesign (grounded di data UAT skripsi)

Dari hasil UAT skripsi (N=32), overall 3,91/5 — tapi **Tugas 4–7 adalah bottleneck UX**
(di bawah rata-rata, di bawah ambang H3 4,0):
- **Tugas 4 — Workbench: 3,53** → `workbench/WorkbenchSheet.tsx`
- **Tugas 5 — Prosedur: 3,56** → `ProcessProgress.tsx`
- **Tugas 6 — Feedback: 3,69** → `ConceptFeedbackModal.tsx` / `GuidedConceptCheckModal.tsx`
- **Tugas 7 — Laporan: 3,66** → `ReportPanel.tsx`

SUS = 68,83 ("Good", masih ada ruang). **Redesign harus paling agresif memperbaiki 4 area ini** —
ada justifikasi akademik untuk fokus di sana.

## 🎨 Arah desain Stardew-style (proposal awal — minta approve user dulu)

- **Palet**: earthy/cozy — kayu coklat hangat, krem parchment, hijau sage, aksen tembaga/emas.
- **Panel**: bordered "wooden frame", sudut sedikit rounded, drop shadow lembut, header bertekstur.
- **Tipografi**: heading pixel/rounded yang readable; body tetap legible (jangan korbankan keterbacaan — instrumen skripsi sensitif soal ini).
- **Ikon/tombol**: chunky, tactile, ada state hover/press jelas.
- **Mood**: ramah, "game-y", tapi tetap kredibel sebagai lab kimia edukatif.

Mulai dari `src/styles/colors.css` + `fonts.css` sebagai sumber token; bikin design system dulu, baru komponen.

## 🛠️ Tooling Figma (SUDAH di-setup, tinggal dipakai)

Dua MCP server di `.mcp.json` app ini:
- **`figma`** (Dev Mode MCP, READ) → baca design/sprites existing: `get_image`, `get_code`, `get_variable_defs`. Butuh Figma desktop + Dev Mode MCP aktif (server di `http://127.0.0.1:3845/mcp`).
- **`TalkToFigma`** (write-bridge, WRITE) → bikin/rapihin frame & komponen di Figma. Repo bridge di `~/Documents/Project/CHEMIST/tools/cursor-talk-to-figma-mcp`.

### Prasyarat sebelum write-bridge bisa dipakai (user yang lakukan)
1. Websocket bridge jalan di terminal terpisah:
   `cd ~/Documents/Project/CHEMIST/tools/cursor-talk-to-figma-mcp && bun socket` (port 3055).
2. Plugin Figma "Cursor Talk to Figma" sudah di-import (manifest:
   `…/cursor-talk-to-figma-mcp/src/cursor_mcp_plugin/manifest.json`) dan **Connect** (dapat channel ID).
3. Di sesi ini: cek `/mcp` (figma + TalkToFigma connected), lalu **`join_channel`** ke channel ID dari plugin.
   Tanpa join_channel, tool tulis nggak akan kena ke Figma.

Kalau `figma` gagal connect: kemungkinan Figma desktop pakai endpoint lama → ganti `url` di `.mcp.json` jadi `http://127.0.0.1:3845/sse`.

## ✅ Rencana kerja

1. **Baca existing**: via `figma` MCP ambil design + sprites yang ada (sprites di-keep). Pahami juga `colors.css`/`fonts.css` + komponen di atas.
2. **Design system Stardew-style**: susun token (warna/font/spacing/komponen) sebagai proposal → **minta user approve** sebelum eksekusi besar.
3. **Author board di Figma** via `TalkToFigma`: page "Redesign v2", frame per screen (Lobby, Room/HUD, Workbench, Prosedur, Feedback, Laporan), komponen + anotasi rapi.
4. **Implement ke kode** `packages/lab-app` (React + Phaser UIScene), prioritaskan 4 area bottleneck. Verifikasi jalan (`bun dev` / sesuai README app).

## ⚠️ Anti-pattern
- ❌ Ganti/regenerate sprites in-world.
- ❌ Korbankan keterbacaan teks demi gaya pixel.
- ❌ Mulai nulis ke Figma sebelum `join_channel`.
- ❌ Commit/push tanpa diminta user.
