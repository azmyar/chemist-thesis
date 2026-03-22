# Thesis Lab (Standalone)

Ekstraksi standalone dari modul `lab-app` dan `lab-server` milik project Chemist.

## Struktur

- `packages/lab-app`: Frontend Next.js untuk multiplayer lab.
- `packages/lab-server`: Backend Cloudflare Worker + Durable Object untuk room/game state.
- `packages/shared`: Shared schema dan type contract antara app dan server.

## Setup

1. Install dependency:

```bash
bun install
```

2. Siapkan env frontend:

```bash
cp packages/lab-app/.env.local.example packages/lab-app/.env.local
```

3. Siapkan env server lokal (opsional):

```bash
cp packages/lab-server/.dev.vars.example packages/lab-server/.dev.vars
```

## Jalankan Development

Jalankan app + server bersamaan:

```bash
bun run dev
```

Atau terpisah:

```bash
bun run dev:server
bun run dev:app
```

## Catatan

- Project ini sudah dipisahkan dari monorepo `chemist`.
- Project berjalan tanpa auth eksternal (guest mode).
- `NEXT_PUBLIC_API_URL` sudah tidak dipakai lagi di `lab-app`.
- `NEXT_PUBLIC_WS_URL` default untuk lokal: `ws://localhost:8787`.
- Port dev `lab-server`: `8787` (Cloudflare Durable Object tetap berjalan normal di port ini).
- `CORE_API_URL` sudah tidak dibutuhkan lagi di `lab-server`.

## Deploy Frontend (Vercel)

1. Import repo ini ke Vercel.
2. Set **Root Directory** ke `packages/lab-app`.
3. Set framework: **Next.js** (otomatis terdeteksi).
4. Tambahkan Environment Variable:

```bash
NEXT_PUBLIC_WS_URL=wss://<your-worker-subdomain>.workers.dev
```

Contoh:

```bash
NEXT_PUBLIC_WS_URL=wss://chemist-lab-server.<account>.workers.dev
```

5. Deploy project di Vercel.

## Deploy Backend (Cloudflare Workers + Durable Object)

1. Login Cloudflare:

```bash
bunx wrangler login
```

2. Dari root project, deploy server:

```bash
bunx wrangler deploy --config packages/lab-server/wrangler.jsonc --env production
```

3. Update `FRONTEND_ORIGIN` di `packages/lab-server/wrangler.jsonc` ke domain Vercel kamu (tanpa trailing slash), lalu deploy ulang jika berubah.

Contoh:

```jsonc
"FRONTEND_ORIGIN": "https://chemist-lab.vercel.app"
```

## Checklist Setelah Deploy

- Cek health backend: `https://<worker-url>/`
- Cek list room: `https://<worker-url>/rooms`
- Buka frontend Vercel dan join room.
- Pastikan websocket connect ke `wss://<worker-url>/room/lab-umum?name=...`
