# HANDOFF → Sesi Skripsi (Dokumentasi SDLC)

> Ditulis dari sesi Claude yang jalan di folder **app** (`~/Documents/Project/CHEMIST/thesis-lab`)
> untuk sesi Claude yang **ngurus skripsi**. Ini kebalikan dari `REDESIGN_HANDOFF.md`
> (yang dulu dikirim dari sesi skripsi ke sesi app).
> Tanggal: 2026-05-25. Semua path absolut supaya sesi skripsi bisa langsung cek.

Tujuan doc ini: nyatet **apa yang sudah dikerjakan** di fase Desain + sebagian Implementasi
redesign UI, lengkap dengan **path artefak**, biar bisa didokumentasikan di skripsi (kerangka SDLC).

---

## 1. Ringkasan eksekutif

Lanjutan dari rencana di `REDESIGN_HANDOFF.md`. Yang sudah dieksekusi sesi ini:

1. **Design System di Figma** (token warna/tipografi/komponen) — acuan visual, brand biru Chemist.
2. **Asset/sprite dirapikan** jadi katalog berlabel di Figma + **rekonstruksi map** dari sprite.
3. **Arah redesign baru** ("REDESIGN v2"): pixel-art vibrant, **tanpa emoji, semua berbasis sprite/aset**,
   plus **NPC "Bu Guru"** yang nanya murid tiap step (gamifikasi).
4. **Implementasi di kode**: 4 komponen popup di-redesign jadi gamified (logic dipertahankan),
   + komponen aset bersama `BuGuru`.
5. **Mockup semua popup di Figma** (Cek Pemahaman, Pembetulan/Warning, Proses, Laporan).

Keputusan arah desain: **pertahankan brand biru** (bukan earthy/Stardew dari proposal awal).

---

## 2. Pemetaan ke fase SDLC (untuk skripsi)

| Fase SDLC | Status | Bukti / artefak |
|---|---|---|
| Planning / Analisis | (sudah, di sesi skripsi) | UAT N=32, SUS 68,83, lihat §6 |
| **Design (UI/UX)** | **Selesai (iterasi 1)** | Figma: Design System, Sprites, Pop-Up, REDESIGN v2 (§4A, §5) |
| **Implementation** | **Sebagian** | 4 komponen popup + `BuGuru` di-redesign di kode (§4B) |
| Testing | Belum (manual/UAT ulang) | cara verifikasi di §7 |
| Maintenance | — | — |

Catatan: implementasi baru menyentuh **lapisan presentasi popup**. Logika game, sprite in-world,
dan integrasi NPC Bu Guru in-game (Phaser) **belum** dikerjakan (lihat §8 "Belum dikerjakan").

---

## 3. Konteks proyek (peta singkat)

- `~/Documents/Project/CHEMIST/thesis-lab` — monorepo bun (app). Fokus kerja.
  - `packages/lab-app` — Next.js + Phaser (frontend).
  - `packages/lab-server` — Cloudflare Worker + Durable Object (backend, multiplayer).
  - `packages/shared` — Zod schemas / protocol.
- `~/Documents/Project/CHEMIST/tools/cursor-talk-to-figma-mcp` — bridge MCP ke Figma.

---

## 4. Apa yang dikerjakan + PATH

### 4A. Design — Figma (via MCP TalkToFigma)

Figma page **"Design System"**. Struktur (top-level frames):
- `Design System` (`1:6596`) — board token: 01 Warna, 02 Tipografi, 03 Komponen.
- `Sprites` (`2:83`) — 73 sprite + map + screenshot, ditata grid berlabel (Player/Tile/Alat/Bahan/Map).
- `Pop-Up` (`4:13890`) — 4 mockup popup + karakter Bu Guru (lihat §5).

Penting soal Figma:
- Channel TalkToFigma **ganti tiap sesi** (terakhir dipakai: `6ji6dmyy`). Sesi baru: jalankan
  `cd ~/Documents/Project/CHEMIST/tools/cursor-talk-to-figma-mcp && bun socket`, buka plugin
  "Cursor Talk to Figma" di Figma desktop, lalu `join_channel` ke channel ID dari plugin.
- **Node ID di Figma tidak stabil** (file diedit manual paralel) — jangan andalkan ID lama;
  pakai `get_document_info` untuk cari frame teratas dulu.
- Map yang di-rebuild + board Iterations sempat dibuat lalu **dirapikan/dihapus manual** oleh user;
  yang tersisa = 3 board di atas.

### 4B. Implementation — Kode (presentasi popup, logic UTUH)

Semua di `~/Documents/Project/CHEMIST/thesis-lab/packages/lab-app/src/`:

| Path | Status | Isi perubahan |
|---|---|---|
| `components/ui/BuGuru.tsx` | **BARU** | NPC Bu Guru pixel-art (SVG inline, 16×24, tanpa kacamata, tanpa emoji). Dipakai bersama. |
| `components/GuidedConceptCheckModal.tsx` | rewrite tampilan | Cek Pemahaman gamified: header biru + Bu Guru + balon tanya + opsi chunky + pips progres + bintang/+10 XP/streak. |
| `components/ConceptFeedbackModal.tsx` | rewrite tampilan | Pembetulan Konsep (warning): header amber + "Bu Guru mengingatkan" + box perbaikan. |
| `components/ProcessProgress.tsx` | rewrite tampilan | Overlay proses: header brand + progress bar. |
| `components/ReportPanel.tsx` | rewrite tampilan | Laporan hasil: header brand + rating bintang (akurasi → 1–3★) + tabel + analisis. |

- **Logic tidak diubah** (mastery/localStorage, shuffle opsi, event listener `window`, perhitungan, timer).
- **Tanpa emoji** — ikon = sprite/blok (Bu Guru SVG, bintang = kotak emas).
- Token sumber: `packages/lab-app/src/styles/colors.css` (primary `#0590d6` + neutral) & `fonts.css` (Outfit/Nunito).
- Verifikasi: `tsc --noEmit` di `packages/lab-app` → exit 0.

---

## 5. Detail popup (Figma frame "Pop-Up" 4:13890)

Empat popup, satu bahasa desain (header strip + body + footer, rounded, tanpa emoji):
1. **Cek Pemahaman** — header biru, avatar Bu Guru, balon "Bu Guru bertanya", 3 opsi, reward (bintang+XP+streak), tombol Jawab.
2. **Pembetulan Konsep** — header amber, balon "Bu Guru mengingatkan", box "Yang perlu diperbaiki", tombol "Paham, Bu".
3. **Proses Berjalan** — header biru, progress bar + sisa waktu.
4. **Laporan Hasil** — header biru + rating 3 bintang, tabel perhitungan kadar, badge deviasi, analisis, tombol Tutup.

---

## 6. Keputusan desain (justifikasi untuk skripsi)

Dari UAT skripsi (N=32): overall **3,91/5**, **SUS 68,83** ("Good"). Bottleneck Tugas 4–7 (di bawah ambang 4,0):
Workbench **3,53** · Prosedur **3,56** · Feedback **3,69** · Laporan **3,66**.

Implikasi pada redesign:
- Prioritas perbaikan = 4 area bottleneck → popup Feedback (Cek Pemahaman + Pembetulan) & Laporan
  sudah di-redesign duluan di sesi ini.
- **Brand biru dipertahankan** (bukan earthy/Stardew) — keputusan user.
- Arah baru: **pixel-art vibrant + gamifikasi** (NPC Bu Guru nanya tiap step, XP/streak/bintang),
  semua **berbasis sprite/aset, tanpa emoji**.

---

## 7. Cara sesi skripsi mengecek / verifikasi

1. **Lihat kode popup**: buka 5 file di §4B.
2. **Jalankan app lokal (multiplayer jalan lokal):**
   - `cd ~/Documents/Project/CHEMIST/thesis-lab/packages/lab-server && bun run dev` (wrangler dev, port 8788, Durable Object lokal)
   - `cd ~/Documents/Project/CHEMIST/thesis-lab/packages/lab-app && bun run dev --port 3001`
   - `.env` sudah set `NEXT_PUBLIC_WS_URL=ws://localhost:8788`.
   - Buka 2 **browser beda / incognito** (sessionId disimpan di localStorage → 2 tab di browser sama = pemain sama).
   - Masuk langsung ke room (lobby `/` ada gate auth cookie `.chemist.id`):
     `http://localhost:3001/room/lab-umum?name=Andi` dan `...?name=Budi`.
   - Catatan: `FRONTEND_ORIGIN` di `wrangler.jsonc` = `localhost:3001`; jalankan app di 3001 biar origin match.
3. **Preview popup tanpa main sampai step** — di Console tab room, dispatch event (kalau tak muncul: `localStorage.clear()` dulu):
   - Cek Pemahaman: `window.dispatchEvent(new CustomEvent('level-state',{detail:{levelId:'lab-umum',xp:30,finished:false,milestones:[{step:3,title:'Pengasaman',completed:true}]}}))`
   - Pembetulan: `window.dispatchEvent(new CustomEvent('concept-feedback',{detail:{title:'...',why:'...',correction:'...',relatedConcept:'...'}}))`
   - Laporan: `window.dispatchEvent(new CustomEvent('level-report',{detail:{levelId:'lab-umum',sampleMassG:0.5012,cuoMassG:0.2498,gravimetricFactor:0.7989,kadarPercent:39.81,theoreticalPercent:40.11,deviationPercent:-0.3,issues:[],decisions:{}}}))`
   - Proses: `window.dispatchEvent(new CustomEvent('process-start',{detail:{label:'Pendidihan larutan',durationMs:8000}}))`
4. **Lihat desain di Figma**: connect plugin TalkToFigma (lihat §4A), buka page "Design System".

---

## 8. Belum dikerjakan (untuk dokumentasi "future work" / lanjutan)

- **Redesign art 73 sprite existing** (player/alat/tile) ke gaya pixel-vibrant — baru NPC Bu Guru yang dibuat.
- **NPC Bu Guru in-game** (Phaser `LabScene`) — saat ini Bu Guru hanya di popup React, belum jadi karakter di map.
- **Sistem gamifikasi penuh** (XP/streak/bintang sebagai state nyata) — di popup masih presentasional.
- **Hapus sisa emoji di game** — mis. `ITEM_EMOJI` & prompt `[E]` di `components/workbench/WorkbenchSheet.tsx`
  dan `game/scenes/LabScene.ts` belum diganti sprite.
- Komponen lain (`ObjectSheet`, HUD `UIScene`, `LobbyView`) belum disamakan ke bahasa desain baru.

---

## 9. Memori sesi (catatan persisten yang bisa dibaca sesi lain di folder ini)

`~/.claude/projects/-Users-azmyaryarizaldi-Documents-Project-CHEMIST-thesis-lab/memory/`
- `MEMORY.md` (indeks)
- `figma-design-system.md` — layout board Figma, node ID, keputusan brand biru, cara reconnect.
- `talktofigma-coordinate-gotcha.md` — gotcha koordinat MCP (create/move parent-relative; `clone_node` penempatannya tidak konsisten; fill `a:0` jadi solid).

---

## 10. Lokasi doc ini

`~/Documents/Project/CHEMIST/thesis-lab/HANDOFF_TO_SKRIPSI.md`
(berdampingan dengan `REDESIGN_HANDOFF.md`). Sesi skripsi: baca file ini dari path tsb.
