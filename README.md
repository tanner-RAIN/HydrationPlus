# Commerce Signal Hub

Static prototype for a unified ecommerce dashboard that compares performance across:

- Instagram
- Facebook
- Google Analytics 4
- Google Search Console
- Shopify
- Faire
- TikTok Shop
- Amazon
- Amazon Ads
- Instacart

## What this gives you

- A single executive dashboard view
- Role-aware KPI comparison across sales, ads, and analytics sources
- Cross-channel revenue mix and intervention flags
- Explicit no-data states for disconnected platforms
- A visible integration map showing what each connector will need

## Run locally

Open `/Users/tannereddingotn/Documents/Playground/index.html` in a browser.

## How to turn this into a real product

1. Add a backend service that stores OAuth tokens and scheduled sync jobs.
2. Create one adapter per platform that maps raw fields into a normalized schema:
   - `channel`
   - `category`
   - `connected`
   - `status`
   - `metrics`
3. Use category-specific metrics instead of forcing one flat model on every source:
   - Sales channels: `revenue`, `orders`, `traffic`, `conversionRate`
   - Ad channels: `spend`, `attributedRevenue`, `traffic`, `orders`, `conversionRate`
   - Analytics sources: `sessions`, `revenue`, `orders`, `conversionRate`
4. Persist raw pulls and transformed facts separately so you can audit platform discrepancies.
5. Add date filters, attribution windows, and margin fields before relying on the numbers for finance decisions.
6. Treat Shopify or your ERP as the commerce source of truth, then reconcile marketing and marketplace data against it.
# HydrationPlus
