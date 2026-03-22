# Shared Package

## Purpose

Single source of truth for schemas, types, UI components, styles, and utilities.
Imported by all frontend apps and by `core` (schemas/types only).

## Structure

```
src/
├── schemas/          # Zod validation schemas (shared between frontend & backend)
├── components/ui/    # Shadcn/UI base components (Button, Input, Label, etc.)
├── lib/utils.ts      # Shared utilities (cn, formatPrice, formatTime, etc.)
├── styles/           # Shared CSS (colors.css, fonts.css, sheets/*.css)
└── index.ts          # Re-exports
```

## Key Rules

- **Never** import from `@chemist/core` or `@chemist/class-app` here
- New UI components go here and are exported from index
- Styles live here — apps import via `@import "@chemist/shared/styles/..."`
- Use CVA (class-variance-authority) for component variants
- Shadcn/UI uses New York style variant with Lucide icons
