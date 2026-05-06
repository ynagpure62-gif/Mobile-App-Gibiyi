# LogoStore

A production-ready eCommerce mobile app for buying and downloading premium digital logo designs, with auth, cart, wishlist, checkout, and order history.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/logo-store run dev` — run the Expo mobile app (Expo dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET`
- Mobile: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY` (prepended in logo-store dev script)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 53 / React Native (Expo Router v6)
- Auth: Clerk (email/password + Google SSO via `@clerk/expo`)
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `lib/api-client-react`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/` — Express server (`app.ts`, `routes/`)
- `artifacts/logo-store/app/` — Expo Router screens (`(auth)/`, `(tabs)/`, `product/[id].tsx`, `checkout.tsx`, `orders.tsx`, `wishlist.tsx`)
- `artifacts/logo-store/components/` — `ProductCard.tsx`, `ErrorBoundary.tsx`
- `artifacts/logo-store/contexts/CartContext.tsx` — cart state (AsyncStorage)
- `artifacts/logo-store/constants/colors.ts` — dark theme tokens (single source of truth)
- `artifacts/logo-store/assets/images/` — 9 AI-generated logo images
- `lib/db/src/schema/index.ts` — DB schema (products, categories, orders, wishlist)
- `lib/api-spec/` — OpenAPI spec → `lib/api-client-react/` (generated hooks)

## Architecture decisions

- Dark-first design: all screens hardcode `colors.dark` directly (no system color scheme detection) since this is a dark premium app
- Static images served by Express at `/api/assets/images/` from `artifacts/logo-store/assets/` (path: `../../logo-store/assets` relative to `dist/`)
- API codegen with Orval generates React Query hooks used by all screens — never call fetch directly
- Clerk proxy URL pattern used so Clerk auth requests go through the same domain (avoids CORS)
- Cart persisted to AsyncStorage via CartContext; wishlist persisted server-side

## Product

- Browse and search logo designs with category/style filtering
- Product detail with image, tags, add to cart, wishlist toggle
- Cart screen with item management and checkout flow
- Order history with download links
- User profile with sign out, orders, and wishlist navigation

## User preferences

- Dark premium UI (deep navy/purple theme, `#080810` background)
- No light mode — always dark

## Gotchas

- Do NOT use `Appearance.setColorScheme` — it throws on web
- Do NOT use `useColorScheme()` for color selection — always use `colors.dark` directly
- Static asset path from `dist/` to logo images: `../../logo-store/assets` (2 levels up, not 3)
- All API routes must handle the full base path `/api/...` (proxy does not rewrite paths)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` must be set at Expo build time

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk configuration details
- See the `expo` skill for Expo/React Native patterns
