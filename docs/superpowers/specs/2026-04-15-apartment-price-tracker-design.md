# Apartment Price Tracker - Design Spec

Track daily apartment prices at Vinhomes Ocean Park 1, 2, and 3 (Hanoi) by crawling batdongsan.com.vn and nhatot.com. Display average price per m² broken down by bedroom type (1PN/2PN/3PN) as charts within the existing Gold Price Tracker app.

## Architecture

- Extends the existing Next.js + Vercel + Turso app
- Adds 2 new scrapers (batdongsan, nhatot), 1 new cron job, 1 new API route, 1 new page section
- Top-level navigation added to switch between Gold and Apartment views
- Same deployment, same DB, same infra

## Data Model

### Table: `apartment_prices`

| Column              | Type                | Description                                         |
|---------------------|---------------------|-----------------------------------------------------|
| `id`                | INTEGER PRIMARY KEY | Auto-increment                                      |
| `date`              | TEXT (YYYY-MM-DD)   | Crawl date                                          |
| `area`              | TEXT                | `ocean_park_1`, `ocean_park_2`, `ocean_park_3`      |
| `bedroom_type`      | TEXT                | `1pn`, `2pn`, `3pn`                                 |
| `avg_price_per_m2`  | INTEGER             | Average price per m² in VND (e.g., 55000000)        |
| `min_price_per_m2`  | INTEGER             | Lowest price per m² from crawled listings           |
| `max_price_per_m2`  | INTEGER             | Highest price per m² from crawled listings          |
| `listing_count`     | INTEGER             | Number of listings used to compute the average      |
| `created_at`        | TEXT                | ISO timestamp when record was created               |

- UNIQUE constraint on `(date, area, bedroom_type)` — upsert on conflict
- Max 9 records per day (3 areas x 3 bedroom types)

## Scraping

### Sources

**batdongsan.com.vn:**
- Use search URL with pre-built filters: area (Ocean Park 1/2/3) + property type (apartment)
- Parse HTML listing results: extract total price and area (m²)
- Crawl first 2-3 pages per query (~60-90 listings)

**nhatot.com:**
- Use search URL with filters for area + bedroom count
- Parse HTML or embedded JSON page data
- Crawl first 2-3 pages per query

### Price Calculation Pipeline

1. Crawl listing pages from both sources
2. For each listing: extract `total_price` and `area_m2`, compute `price_per_m2 = total_price / area_m2`
3. Group by (area, bedroom_type)
4. Remove outliers: discard listings where price/m² is more than 2x the median or less than 0.5x the median
5. Compute avg, min, max from remaining listings
6. Store 1 record per (date, area, bedroom_type) combination

### Search Queries

9 query combinations per source (3 areas x 3 bedroom types):

| Area | Filter keywords / location IDs |
|------|-------------------------------|
| Ocean Park 1 | Vinhomes Ocean Park, Gia Lâm |
| Ocean Park 2 | Vinhomes Ocean Park 2, Văn Giang |
| Ocean Park 3 | Vinhomes Ocean Park 3, Văn Giang |

Bedroom types: 1 phòng ngủ, 2 phòng ngủ, 3 phòng ngủ

### Cron Schedule

`0 3 * * *` UTC = 10:00 AM Vietnam time — runs 1 hour after the gold scrape cron.

### Error Handling

- If one source fails (blocked, timeout, HTML structure changed), still save data from the other source
- If both sources fail for a given (area, bedroom_type), skip that combination for the day — no partial/zero data stored
- Log all errors with source name and reason

### Cron Security

Same as gold: protected by `CRON_SECRET` header check via `Authorization: Bearer <CRON_SECRET>`.

## API Routes

### `GET /api/apartment-prices?range=1m&area=ocean_park_1`

Returns apartment price history.

- Query param `range`: `1m`, `3m`, `6m` (default: `1m`)
- Query param `area`: `ocean_park_1`, `ocean_park_2`, `ocean_park_3`, or omit for all areas
- Response: JSON array of `{ date, area, bedroom_type, avg_price_per_m2, min_price_per_m2, max_price_per_m2, listing_count }` sorted by date ASC

### `POST /api/cron/scrape-apartments`

Triggered by Vercel Cron. Crawls both sources, calculates prices, stores results.

- Protected by `CRON_SECRET` header check
- Returns `{ success: true, records_saved: N }` on success
- Returns `{ success: false, error }` on failure

## Frontend

### Navigation

Add top-level navigation to the app:
- Pill buttons at the very top: `GOLD` | `APARTMENT`
- Each section keeps its own time range selector and content below
- Default view: Gold (current behavior preserved)

### Apartment Page Layout (mobile-first)

1. **Header** — "Apartment Price Tracker", subtitle showing latest crawl date and total listings

2. **Area Selector** — pills: `All` (default) | `OP1` | `OP2` | `OP3`

3. **Time Range Selector** — pills: `1M` (default) | `3M` | `6M`

4. **Line Chart** (Chart.js)
   - When a specific area is selected: 3 lines (1PN blue, 2PN orange, 3PN green) showing avg price/m² over time
   - When "All" is selected: show 3 lines (one per area) for a single bedroom type. Add a bedroom type selector (`1PN` | `2PN` | `3PN`, default `2PN`) that appears only in "All" view. This avoids 9 overlapping lines.
   - Y-axis: price per m² in millions VND (e.g., "55M")
   - Touch-friendly tooltips

5. **Stats Bar**
   - Current avg price/m² for each bedroom type in the selected area
   - Change % vs 1 week ago (or vs first data point if less than 1 week)
   - Listing count (how many listings the average is based on)

6. **Price Table**
   - Scrollable daily price list
   - Columns: date, 1PN avg, 2PN avg, 3PN avg

### Design

- Same dark theme as Gold section
- Same component patterns (card, stat-grid, pill-group, price-table)
- Vietnamese number formatting

## Project Structure (new/modified files)

```
src/
  app/
    page.tsx                          # Modified — add nav, route to Gold or Apartment view
    api/
      apartment-prices/
        route.ts                      # GET /api/apartment-prices
      cron/
        scrape-apartments/
          route.ts                    # POST /api/cron/scrape-apartments
  lib/
    apartment-scraper.ts              # Crawl + parse logic for both sources
    apartment-scraper-batdongsan.ts   # batdongsan.com.vn specific parsing
    apartment-scraper-nhatot.ts       # nhatot.com specific parsing
    apartment-indicators.ts           # Price calculation, outlier removal, aggregation
  components/
    NavBar.tsx                        # Top-level GOLD | APARTMENT navigation
    ApartmentView.tsx                 # Container for apartment section
    AreaSelector.tsx                   # OP1/OP2/OP3/All pills
    ApartmentChart.tsx                # Chart.js line chart for apartment prices
    ApartmentStatsBar.tsx             # Current prices, trends, listing counts
    ApartmentPriceTable.tsx           # Daily price history table
__tests__/
  lib/
    apartment-scraper-batdongsan.test.ts
    apartment-scraper-nhatot.test.ts
    apartment-indicators.test.ts
  api/
    apartment-prices.test.ts
    scrape-apartments.test.ts
vercel.json                           # Modified — add second cron entry
```

## vercel.json Update

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/scrape-apartments",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## Out of Scope

- Individual listing details (we only track aggregated price/m²)
- Rental prices (only sale prices)
- Areas other than Ocean Park 1/2/3
- Price alerts or notifications
- Historical data backfill (starts collecting from deployment date)
- Map or location visualization
