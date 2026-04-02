# Redeploy Guide

This document is the quick runbook to redeploy backend (Cloudflare) and frontend (Vercel).

## Prerequisites

- You are logged in to Cloudflare Wrangler:

```bash
bunx wrangler whoami
```

- You are logged in to Vercel CLI:

```bash
vercel whoami
```

## 1. Redeploy Backend (Cloudflare Worker + Durable Object)

Run from project root:

```bash
cd /Users/azmyaryarizaldi/Documents/Project/CHEMIST/Product/thesis-lab/packages/lab-server
bunx wrangler deploy --config wrangler.jsonc --env production
```

Expected output includes:

- Worker URL (example): `https://chemist-lab-server-production.chemist-dev.workers.dev`
- Binding `env.GAME_ROOM` attached

### If frontend domain changes

Update `FRONTEND_ORIGIN` in `packages/lab-server/wrangler.jsonc` under `env.production.vars`, then deploy backend again.

Example value:

```json
"FRONTEND_ORIGIN": "https://lab-app-seven.vercel.app"
```

## 2. Redeploy Frontend (Vercel)

Run from project root:

```bash
cd /Users/azmyaryarizaldi/Documents/Project/CHEMIST/Product/thesis-lab
vercel --prod --yes --cwd packages/lab-app
```

## 3. Ensure Vercel Environment Variable is set

Frontend needs websocket URL in Vercel project env:

- `NEXT_PUBLIC_WS_URL=wss://chemist-lab-server-production.chemist-dev.workers.dev`

Check env list:

```bash
vercel env ls --cwd /Users/azmyaryarizaldi/Documents/Project/CHEMIST/Product/thesis-lab/packages/lab-app
```

If missing, add it:

```bash
printf 'wss://chemist-lab-server-production.chemist-dev.workers.dev\n' | vercel env add NEXT_PUBLIC_WS_URL production --cwd /Users/azmyaryarizaldi/Documents/Project/CHEMIST/Product/thesis-lab/packages/lab-app
```

After adding/changing env, redeploy frontend once more.

## 4. Post-Deploy Checks

Backend checks:

```bash
curl -i https://chemist-lab-server-production.chemist-dev.workers.dev/
curl -i https://chemist-lab-server-production.chemist-dev.workers.dev/rooms
```

Frontend checks:

- Open production URL:
  - `https://lab-app-seven.vercel.app`
- Enter room and verify multiplayer connection works.

## 5. Common Issues

### Error: `new_sqlite_classes` required

Cause: Durable Object migration still using old migration key.

Fix: in `packages/lab-server/wrangler.jsonc`, use:

```json
"new_sqlite_classes": ["GameRoom"]
```

### Error: missing `env.GAME_ROOM` binding in production

Cause: `durable_objects` is not inherited automatically by `env.production`.

Fix: define `durable_objects.bindings` explicitly in `env.production` (and `env.staging` if needed), then redeploy backend.

### Vercel build fails with workspace protocol

Cause: `workspace:*` dependency protocol is not supported in this deployment setup.

Fix: avoid workspace protocol for deploy path dependencies and keep frontend build self-contained.
