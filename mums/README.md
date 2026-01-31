# Mums 🍲

Mums är en snygg one-pager för att söka och utforska recept via **TheMealDB**.  
Du kan filtrera på kategori, öppna en detaljvy, spara favoriter som ligger kvar efter reload och få ett slumpmässigt recept.

## Köra projektet

```bash
npm install
npm run dev


Öppna: http://localhost:3000

Köra tester
npm run test:run



## Funktioner

Sök på receptnamn

Kategori-filter (hämtas från API)

Receptkort i grid (bild, namn, kategori) + tydliga hover-states

Detaljvy (modal) med tabs: Ingredienser / Instruktioner

Favoriter (★) sparas i localStorage och finns kvar efter omladdning

Random-recept (🎲)

Dela recept (kopierar länk, fallback till prompt)

Dark mode med sparad preferens

URL-state: ?q= och ?cat= fungerar med browser back/forward



## Teknikval & motivering

Next.js 14 (App Router) + TypeScript
Stabil grund med tydlig komponent-/routingmodell. TypeScript används för typade API-responses och props.

Tailwind CSS (v3)
Snabbt att iterera UI med konsekventa spacing/typografi, samt bra dark mode-stöd via class.

Framer Motion
Små, medvetna transitions (modal/panel/cards) för bättre UX utan att överdriva.

Vitest + Testing Library
Snabba tester för kärnlogik (t.ex. ingrediens-parser) och enkel UI-sanity.

Struktur

src/lib/ – typed TheMealDB-client + helpers (t.ex. ingredient-parser)

src/hooks/ – useFavorites, useTheme, useMinimizedHeader

src/components/ – Header, grid/cards, modal, favorites panel

public/ – logo + favicons + site.webmanifest



## API

Data hämtas från TheMealDB (ingen API-nyckel krävs).
Endpoints som används: sök, kategorier, filter per kategori, lookup per id, random.