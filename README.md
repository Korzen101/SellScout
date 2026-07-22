# SellScout

Desktop app for Amazon resellers: finds products with the highest likelihood of
being profitable by scoring **demand, trend momentum, competition, margin and
risk**, analyzes **any live ASIN** (via Keepa), compares **sourcing costs across
marketplaces** (Alibaba, AliExpress, DHgate, retail clearance, eBay lots, Faire),
models **full FBA unit economics**, tracks products through a **pipeline**
(idea → live) with supplier quotes, imports your **Seller Central transaction
reports** for actual P&L, follows **market news**, and connects to your
**Amazon Seller account** for business insights.

## Run

```bash
npm install
npm start
```

Useful scripts:

| Command | What it does |
|---|---|
| `npm start` | Launch the desktop app |
| `npm test` | Unit tests for the fee model, scoring engine and report parser |
| `npm run smoke` | Boot + auto-quit sanity check (CI-friendly) |
| `npm run preview` | Serve the UI at http://localhost:5173 for browser preview (demo data only) |
| `npm run dist` | Build the Windows installer (electron-builder) |

Releases: pushing a `v*` tag runs CI (tests → Windows installer → GitHub
Release). Installed builds auto-update from Releases via electron-updater.

## Pages

- **Dashboard** — top opportunities, market pulse, category strength, latest intel
- **Product Finder** — the full ranked catalog with filters; click any row for a
  deep-dive drawer (score breakdown, 12-month trend, unit economics, sourcing
  options, competition, risk factors, research links)
- **Sourcing** — every product × supplier ranked by ROI, side-by-side source
  comparison, marketplace playbook
- **Trends & News** — rising/fading categories, month-by-month seasonal planner,
  live RSS market news with opportunity/risk tagging
- **Profit Calculator** — complete FBA workbench: referral %, size-tier FBA fees,
  duty, ads (TACoS), returns, storage; monthly projection + sensitivity table
- **Pipeline** — kanban board from Idea to Live; per-product notes and supplier
  quotes attach in the product drawer
- **My Business** — connect your Amazon Seller account via SP-API; revenue,
  profit, orders, and inventory-cover dashboard (simulated until connected).
  Import a Seller Central **transaction report CSV** + per-SKU COGS for actual
  P&L — no API needed
- **Settings** — API keys (with links), currency, notifications, backup/restore,
  activity log, economics assumptions (versioned fee schedule)

## Live data — what's real out of the box

| Source | Status |
|---|---|
| Market news (RSS: Retail Dive, Practical Ecommerce, TechCrunch, Marketplace Pulse) | **Live**, free, no key — press ↻ in the title bar |
| Product catalog & trend numbers | Bundled research dataset (clearly labeled "Demo") |
| Amazon best-sellers / price history | Add a [Keepa](https://keepa.com/#!api) API key in Settings |
| Your own orders / revenue / inventory | Connect SP-API credentials on **My Business** |

### Connecting your Amazon account (SP-API)

1. Seller Central → Apps & Services → **Develop Apps** → register as developer
   (self-authorization for your own account is enough).
2. Create an app client → you get an **LWA Client ID** and **Client Secret**.
3. Use the app's **Authorize** action to generate a **Refresh Token**.
4. Paste all three into **My Business → Connect account**.

Secrets are encrypted at rest with Windows DPAPI (Electron `safeStorage`) and are
only ever transmitted to `amazon.com` endpoints for authentication.

## Notes

- All fees/profit figures are estimates from simplified US FBA rate cards —
  verify with Amazon's revenue calculator before ordering inventory.
- Scraping Amazon directly violates their ToS, which is why live catalog data
  goes through official/paid APIs (Keepa, Rainforest, SP-API).
- Not affiliated with or endorsed by Amazon.com, Inc.
