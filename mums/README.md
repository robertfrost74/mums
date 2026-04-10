# Mums

Mums är en familje-receptapp där du samlar, delar och hanterar familjens recept. Appen är byggd som en PWA så att den kan installeras på telefonen och användas som en native app.

## Köra projektet

```bash
npm install
npm run dev
```

Öppna: [http://localhost:3000](http://localhost:3000)

## Funktioner

- Familjens receptsamling med Supabase-databas
- Sök recept på titel
- Filtrera på kategori
- Slå på/av recept (aktiva/inaktiva)
- Lägg till nya recept med ingredienser
- Inloggning med e-post och lösenord
- Multi-tenancy: varje familj ser bara sina egna recept
- Dark mode med sparad preferens
- PWA: installerbar som app med service worker
- Responsiv design med Tailwind CSS

## Teknikstack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** – PostgreSQL databas, autentisering, Row Level Security
- **Tailwind CSS v3** – styling med dark mode
- **Framer Motion** – animationer
- **Serwist** – PWA service worker
- **Vitest** – tester

## Databassetup

1. Skapa ett Supabase-projekt på [supabase.com](https://supabase.com)
2. Kör SQL-migrationen i `supabase/migration.sql` via SQL Editor i Supabase Dashboard
3. Kopiera `.env.local.example` och fyll i dina Supabase-credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://ditt-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-nyckel
SUPABASE_SERVICE_ROLE_KEY=din-service-role-nyckel
```

## Projektstruktur

- `src/app/` – Sidor: hem, login, lägg till recept
- `src/components/` – UI-komponenter: Header, RecipeCard, RecipeGrid, RecipeDetailModal
- `src/lib/supabase/` – Supabase-klienter (browser, server, middleware)
- `src/lib/` – Typer och databastyper
- `src/hooks/` – useTheme, useMinimizedHeader
- `src/middleware.ts` – Auth-skydd för alla routes
- `supabase/` – Databasmigration
