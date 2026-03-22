# Lab App (Next.js 15 + Phaser Game Frontend)

Multiplayer pixel art lab game at `lab.chemist.id`.

## Quick Start

```bash
cd packages/lab-app
bun run dev    # Next.js Turbopack dev server on port 3001
bun run build  # Production build
```

## Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout (fonts, Redux)
│   ├── page.tsx              # Lobby (SSR, auth check)
│   └── room/[roomId]/
│       └── page.tsx          # Game room (CSR, Phaser)
├── game/                     # Phaser game code (NOT React)
│   └── scenes/
│       ├── BootScene.ts      # Asset preloading / placeholder generation
│       ├── LabScene.ts       # Main game (players, map, network)
│       └── UIScene.ts        # HUD overlay
├── components/               # React components
│   ├── GameCanvas.tsx        # Phaser mount bridge
│   ├── GameView.tsx          # Game + overlays wrapper
│   ├── LobbyView.tsx         # Room list UI
│   ├── ChatOverlay.tsx       # Chat input
│   └── VirtualJoystick.tsx   # Mobile touch input
├── lib/
│   ├── api/                  # RTK Query (auth only)
│   ├── state/                # Redux store (minimal)
│   └── network/
│       └── client.ts         # WebSocket connection manager
└── styles/                   # Tailwind theme (shared colors/fonts)
```

## Key Rules

- Game state lives in Phaser scenes, NOT in React state
- React manages: auth, lobby UI, chat overlay, mobile joystick
- Communication between React ↔ Phaser uses `window.CustomEvent`
- Phaser canvas is CSR-only (`dynamic` import with `ssr: false`)
- Auth: reads shared `auth-token` cookie from `.chemist.id`
- On 401: redirect to `class.chemist.id/login`
- Env: `.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
