# Gas Match

A live gas-price comparison web app. Uses the browser's geolocation (or a ZIP
fallback) to find nearby stations and surface the cheapest prices.

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind**
- **React Leaflet** + **OpenStreetMap** tiles (no API key)
- All third-party calls go through `/app/api/*` so no keys leak to the client
- In-memory TTL cache (15 minutes) keyed by rounded lat/lng

## Quick start

```bash
cp .env.example .env.local   # optional — defaults work without editing
npm install
npm run dev
```

Open http://localhost:3000. You can grant location access, or enter a ZIP.

## Configuration

| Var             | Default            | Meaning                                                                 |
| --------------- | ------------------ | ----------------------------------------------------------------------- |
| `PRICE_MODE`    | `estimated`        | `estimated` (baseline + brand factor) or `live` (requires real adapter) |
| `CONTACT_EMAIL` | `dev@example.com`  | Used in the User-Agent sent to Overpass/Nominatim per their policies    |

## How prices work

### `PRICE_MODE=estimated` (default)

There is **no free, public, real-time US gas-price API**. This repo ships an
*estimated* price layer so you can see the full experience without paying for
data. For each station we combine:

1. The state-average regular price (AAA-style snapshot in
   `lib/sources/prices-estimated.ts` — update the table periodically).
2. A per-brand adjustment (Costco/Sam's lower, Chevron/Shell higher) from
   `lib/brands.ts`.
3. A deterministic per-station jitter so refreshes are stable.
4. Typical grade premiums (+$0.40 mid, +$0.80 premium, +$0.55 diesel).

Every estimated row is clearly labelled "Estimated" in the UI via the banner
and per-station metadata.

### `PRICE_MODE=live`

Set `PRICE_MODE=live` and implement `fetchLivePrices` in
`lib/sources/prices-live.ts`. Candidate feeds (check ToS first):

- **GasBuddy Business API** — paid, contracted.
- **MyGasFeed** — community, read their license.
- **State feeds** — e.g. New Jersey Motor Fuels, Connecticut/Mass weekly reports.
- **OPIS / EIA** — wholesale; useful for baselines, not retail.

The adapter just needs to return a `PriceSet` (`{ regular, mid, premium, diesel }`)
for each station; the route already handles the rest.

## Data sources & legal notes

- **Stations:** [Overpass API](https://overpass-api.de/) (`amenity=fuel`).
  Data © OpenStreetMap contributors, licensed under
  [ODbL](https://opendatacommons.org/licenses/odbl/). Attribution is shown in
  the footer. We send a descriptive `User-Agent` with a contact email and
  rate-limit requests to **1 request/sec** as courtesy (see
  [Overpass usage policy](https://operations.osmfoundation.org/policies/api/)).
- **ZIP geocoding:** [Nominatim](https://nominatim.openstreetmap.org/). Same
  attribution + User-Agent + 1 rps policy; see
  [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
- **Directions:** deep link to Google Maps (no API use).
- **Do not scrape GasBuddy / Google / etc.** This repo explicitly does **not**
  ship a scraper. Scraping those sites violates their ToS, triggers bot
  detection, and will break. If you must experiment, keep it local and
  licensed — not in a committed branch.

## Caching & rate limits

- `lib/cache.ts` is a simple in-memory `Map` with TTL; on a serverless host
  each instance has its own cache (fine for a small app, but if you deploy at
  scale, swap it for Redis).
- `lib/rateLimit.ts` serializes outbound calls to Overpass/Nominatim at
  ≥1.1 s spacing so we stay polite.

## Test ZIPs

The plan calls for smoke tests with three ZIPs in different states:

| ZIP   | City          | What to check                                       |
| ----- | ------------- | --------------------------------------------------- |
| 58103 | Fargo, ND     | Sparser results, rural-ish stations                 |
| 90001 | Los Angeles   | Very dense, highest CA baseline                     |
| 10001 | New York, NY  | Urban edge case — many "independent" (unbranded)    |

Try each with the ZIP fallback in the UI; confirm the list view sorts by
regular price ascending, the cheapest row is highlighted, and the map markers
are colored by quartile.

## State Map (`/map`)

A US choropleth of state-average gas prices, styled like a political/election
map (diverging green → yellow → red centered on the national average). Alaska
and Hawaii insets are handled by the `geoAlbersUsa` projection; DC is shown as
a labeled dot.

- Toggle between Regular / Mid / Premium / Diesel — the map recolors in place.
- Legend shows quintile breakpoints plus a national-average marker.
- Hover a state → price card with all 4 grades and delta vs national.
- Click (or Enter) locks the tooltip; click again or press Esc to unlock.
- "Sort states" side panel ranks cheapest → most expensive for the active grade.
- Colorblind mode replaces solid fills with SVG patterns (dots, diagonals, crosshatch).
- Every state path has an `aria-label` with the current price, `tabIndex=0`,
  and keyboard activation.

### Data sources

| Order | Source                                                        | Key?              | Notes                                                                                |
| ----- | ------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| 1     | [AAA state gas price averages](https://gasprices.aaa.com/state-gas-price-averages/) | no                | Server-side HTML fetch + parse, cached 6 h, descriptive User-Agent, **never called from the client**. The cache key is a single string so the AAA page is touched at most 4×/day per process. |
| 2     | [EIA v2 API](https://www.eia.gov/opendata/)                   | `EIA_API_KEY`     | Weekly PADD-region retail prices projected to all states in the region. Used only if AAA parse returns <25 populated rows. |

The API always labels each row with its source (`"AAA"` or `"EIA"`) and the
page shows a "Source: …" badge + last-updated timestamp.

### Legal / ethical notes on AAA

- AAA publishes this table publicly for consumer reference. Their
  `robots.txt` at the time of writing allows general crawlers; the page has
  no paywall or login. We still rate-limit ourselves to a **cached 6-hour
  window**, send a descriptive `User-Agent` with a contact email, and credit
  AAA on the map ("Source: AAA"). If you're deploying this, please keep the
  attribution, keep the cache window ≥ 6 h, and honor any future
  `robots.txt` / ToS change.
- We do not re-publish AAA's full dataset — only the current snapshot
  needed to render the visualization.
- If AAA's structure changes and parsing breaks, we fall back to EIA rather
  than hammering the AAA page retrying.

### Tests

The AAA parser has a fixture-backed unit test (`test/aaa.test.ts`) that runs
against `test/fixtures/aaa.html` — no network access required.

```bash
npm test
```

## File layout

```
app/
  page.tsx                 # station finder (location → list/map)
  map/page.tsx             # state choropleth
  layout.tsx
  globals.css
  api/
    stations/route.ts      # GET lat,lng,radius → stations[]
    geocode/route.ts       # GET zip → {lat,lng,label}
    state-averages/route.ts # GET → state choropleth payload (6h cache)
lib/
  cache.ts                 # TTL cache + coord rounding
  rateLimit.ts             # serial per-host spacer
  brands.ts                # brand normalization + price factors
  choropleth.ts            # quintile + color + pattern helpers
  types.ts
  geo/us-states.ts         # code / name / FIPS / PADD table
  sources/
    overpass.ts            # OSM fuel station client
    prices-estimated.ts    # state avg × brand × jitter
    prices-live.ts         # stubbed — plug in your adapter
    aaa.ts                 # AAA state table HTML parser
    eia.ts                 # EIA weekly PADD fallback
components/
  LocationGate.tsx
  StationList.tsx
  StationMap.tsx           # dynamic import — no SSR (Leaflet is DOM-only)
  PriceCard.tsx
  Nav.tsx                  # shared top nav (Station Finder / State Map)
  StateChoropleth.tsx      # dynamic import — react-simple-maps
  StatePriceLegend.tsx     # gradient bar + grade toggle + colorblind toggle
  StateHoverCard.tsx       # tooltip / locked card
  StateRankTable.tsx       # ranked side panel
public/
  data/states-10m.json     # us-atlas topojson, fetched once by the map
test/
  fixtures/aaa.html        # AAA parser fixture
  aaa.test.ts              # vitest parser tests
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint`
- `npm test` — run vitest (AAA parser)

## Contributing a real price source

1. Obtain permission / a license from the provider.
2. Implement `fetchLivePrices` in `lib/sources/prices-live.ts`. Return `null`
   per station when you don't have a reading so the caller can fall back to
   estimated data.
3. Deploy with `PRICE_MODE=live`. The UI banner will disappear automatically
   once at least one station reports `priceSource: "live"`.
