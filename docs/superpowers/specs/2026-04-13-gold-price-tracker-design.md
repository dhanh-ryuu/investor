# Gold Price Tracker - Design Spec

A mobile-first web app that scrapes daily gold prices from vangquytung.com and displays them as an interactive chart with basic indicators, to support buying decisions.

## Architecture

- **Stack:** Next.js (App Router) + Vercel (free tier) + Turso (SQLite edge DB, free tier)
- **Single repo**, single deployment — Next.js handles both API routes and the frontend
- **Scraping:** Vercel Cron triggers `/api/cron/scrape` once daily at 9:00 AM Vietnam time (UTC+7 → cron `0 2 * * *` UTC)
- **Chart library:** Chart.js (lightweight, touch-friendly, good mobile support)
- **HTML parsing:** cheerio (server-side, in the scrape API route)

## Data Model

### Table: `gold_prices`

| Column       | Type                | Description                          |
|--------------|---------------------|--------------------------------------|
| `id`         | INTEGER PRIMARY KEY | Auto-increment                       |
| `date`       | TEXT (YYYY-MM-DD)   | Price date, UNIQUE constraint        |
| `buy_price`  | INTEGER             | Buy price in VND (e.g., 15200000)    |
| `sell_price` | INTEGER             | Sell price in VND (e.g., 15700000)   |
| `created_at` | TEXT                | ISO timestamp when record was scraped |

- Prices stored as integers in VND (no decimals needed for gold prices)
- `date` has a UNIQUE constraint — upsert on conflict to prevent duplicates if cron fires twice

## Scraping

- Target URL: `https://vangquytung.com/`
- Parse HTML with cheerio, find the row containing "Vàng Quý Tùng 9999"
- Extract buy and sell prices, strip formatting (dots/commas), convert to integers
- Store in `gold_prices` table via Turso client (`@libsql/client`)
- **Error handling:** If the site is unreachable or the price row is not found, log the error and skip. No partial data stored. No retries (stay within free tier limits).

### Cron Security

The `/api/cron/scrape` route is protected by checking the `Authorization` header for the `CRON_SECRET` environment variable (Vercel's built-in cron auth mechanism).

## Frontend

### Layout (mobile-first, single page, top to bottom)

1. **Header**
   - App title: "Gold Price Tracker"
   - Current 9999 gold price: buy and sell
   - Daily change amount and percentage (color-coded)

2. **Time Range Selector**
   - Pill buttons: `1M` | `3M` (default) | `6M`

3. **Line Chart** (Chart.js)
   - Two lines: buy price (blue), sell price (orange)
   - MA7 overlay: solid thin line
   - MA30 overlay: dashed line
   - Touch-friendly tooltips: tap a point to see date + exact prices
   - Y-axis formatted in millions VND (e.g., "15.2M")
   - Responsive, fills screen width

4. **Stats Bar**
   - Period high / low prices
   - Price change % over selected period
   - Current spread (sell - buy)

5. **Price History Table**
   - Scrollable list of recent daily prices
   - Columns: date, buy, sell, daily change

### Design

- Dark theme (common for financial apps, easier on the eyes)
- Vietnamese locale for number formatting (dots as thousand separators)
- No authentication — personal tool
- PWA-capable: `manifest.json` for "add to home screen" on mobile, no offline mode

## Indicators

All computed on the frontend from raw price data (no extra DB queries or backend computation).

- **MA7** (7-day moving average) — short-term trend, rendered as a solid thin line on the chart
- **MA30** (30-day moving average) — medium-term trend, rendered as a dashed line
- **Daily change** — absolute VND and % compared to previous day
- **Period change** — % change over the selected time range
- **High/low markers** — dot markers on the chart highlighting the highest and lowest points in the selected range, with date and price labels
- **Color coding** — green for price drops (favorable to buy), red for price increases

## API Routes

### `GET /api/prices?range=3m`

Returns price history for the requested range.

- Query param `range`: `1m`, `3m`, `6m` (default: `3m`)
- Fetches an extra 30 days before the requested range so MA30 can be computed across the full visible window
- Response: JSON array of `{ date, buy_price, sell_price }` sorted by date ascending

### `POST /api/cron/scrape`

Triggered by Vercel Cron. Scrapes current prices and stores them.

- Protected by `CRON_SECRET` header check
- Returns `{ success: true, date, buy_price, sell_price }` on success
- Returns `{ success: false, error }` on failure

## Project Structure

```
investor/
  src/
    app/
      page.tsx              # Main (only) page
      layout.tsx            # Root layout, metadata, PWA manifest link
      globals.css           # Dark theme styles
      api/
        prices/
          route.ts          # GET /api/prices
        cron/
          scrape/
            route.ts        # POST /api/cron/scrape
    lib/
      db.ts                 # Turso client setup
      scraper.ts            # HTML fetch + cheerio parsing
      indicators.ts         # MA calculation, change % (used on frontend)
    components/
      PriceChart.tsx        # Chart.js wrapper
      StatsBar.tsx          # High/low, change %, spread
      PriceTable.tsx        # Scrollable history table
      TimeRangeSelector.tsx # 1M/3M/6M pill buttons
      Header.tsx            # Current price + daily change
  public/
    manifest.json           # PWA manifest
  vercel.json               # Cron job config
  package.json
  tsconfig.json
```

## Environment Variables

| Variable         | Description                        |
|------------------|------------------------------------|
| `TURSO_URL`      | Turso database URL                 |
| `TURSO_AUTH_TOKEN` | Turso auth token                 |
| `CRON_SECRET`    | Secret for Vercel cron auth header |

## Deployment

1. Create Turso database and get credentials
2. Create Vercel project, connect GitHub repo
3. Set environment variables in Vercel dashboard
4. `vercel.json` configures the cron schedule
5. Push to main — Vercel auto-deploys

## Out of Scope

- Multi-gold-type tracking (only 9999)
- Silver tracking
- Buy signal / recommendation engine
- User accounts or authentication
- Offline mode
- Notifications or alerts
