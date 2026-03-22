# Lab Server (Cloudflare Workers + Durable Objects)

Real-time multiplayer game server for ChemistLab.

## Quick Start

```bash
cd packages/lab-server
wrangler dev --port 8788   # Local dev server
```

## Structure

```
src/
├── index.ts                  # Hono entry, routes to GameRoom DO
├── rooms/
│   └── GameRoom.ts           # Durable Object (WebSocket, game state, tick)
└── auth/
    └── validate.ts           # Validate auth-token via core /me endpoint
```

## Key Rules

- Each game room = 1 Durable Object instance
- WebSocket connections managed by DO (`acceptWebSocket` + hibernation API)
- Auth validated on WebSocket upgrade by calling core `GET /me` endpoint
- Message protocol defined in `@chemist/shared` (`schemas/lab.ts`)
- Server tick at 15Hz when players are present, stops on empty room
- All player-facing text in Indonesian
- Env: `.dev.vars` — `CORE_API_URL`

## Deploy

```bash
wrangler deploy --env staging --minify
wrangler deploy --env production --minify
```
