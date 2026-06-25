# Century17Toys — Soft Toy Storefront

A lightweight, static e-commerce storefront for Century17Toys. Pure HTML/CSS/JavaScript — no build step, no backend — so it deploys directly to GitHub Pages.

## How it works

- **Catalog source:** the store reads products live from a Google Sheet (via the `gviz` CSV endpoint), so editing the sheet updates the published site automatically. A short in-session cache avoids refetching on every page navigation.
- **Offline fallback:** if the sheet can't be reached, the store falls back to the bundled `products.json`.
- **Images:** image columns accept normal URLs or Google Drive share links. Drive links are converted to high-resolution thumbnail URLs automatically. Drive files must be shared "Anyone with the link → Viewer".
- **Cart & checkout:** cart is stored in the browser (`localStorage`); checkout submits the order to a Google Form (configured in `config.js`).

## Files

| File | Purpose |
|------|---------|
| `index.html` / `script.js` | Catalog grid: search, filters, sorting, cart, checkout |
| `product-detail.html` / `product-script.js` | Single product page with image gallery and suggestions |
| `common.js` | Shared helpers: sheet config, Drive link conversion, CSV parsing, product processing, min-billing/discount logic, admin panel & billing popup |
| `products.json` | Offline fallback catalog |
| `config.js` | Google Form endpoint, store settings, admin password + default min-billing/discount tiers |
| `excel-to-json.html` | Admin tool: regenerate `products.json` from the sheet or an Excel/CSV file |
| `styles.css` | All styling |

## Minimum billing & discounts (admin)

The store can enforce a **minimum order value** and apply an **order-value discount ladder** (e.g. 2% at ₹50,000, 3.5% at ₹1,00,000, 5% at ₹3,00,000). Customers below the minimum are shown a mobile popup asking them to add more, and the same popup shows how much further to order to unlock the next discount. Discounts are applied to the cart total and included in the order sent to your Google Form.

**These rules live in a `Settings` tab in the same Google Sheet** as the catalog, so editing the sheet updates the rules for every customer. If the tab is missing/unreachable, the defaults in `config.js` (`defaultStoreSettings`) are used instead.

Create a tab named **`Settings`** (matches `CONFIG.settingsSheetName`) with these exact column headers in row 1 — `key`, `value`, `percent` — and rows like:

| key | value | percent |
|-----|-------|---------|
| enabled | TRUE | |
| min_billing | 15000 | |
| tier | 50000 | 2 |
| tier | 100000 | 3.5 |
| tier | 300000 | 5 |

- `enabled` — `TRUE`/`FALSE` master switch for the whole feature.
- `min_billing` — ₹ minimum cart value required to check out.
- `tier` rows — `value` is the ₹ threshold, `percent` is the discount at/above it. Add or remove as many as you like; they're sorted automatically.

**Admin panel:** type `update_value` in the search box and enter the admin password (set `adminPassword` in `config.js`). The panel shows the current live settings, validates them, lets you preview what a customer sees for any cart value, and links to the sheet. ⚠️ Because this is a static site, the password lives in client-side code — it deters casual customers but is not truly secret. Editing the settings still happens in the Google Sheet (then tap **Refresh from sheet** in the panel).

## Updating the catalog

Just edit the Google Sheet — the live site picks it up. To refresh immediately, type `refreshmerightnow` in the store's search box (force-refetches the live data and bypasses the cache).

To regenerate the offline `products.json` fallback, open `excel-to-json.html`, type `refreshmerightnow`, download the file, and commit it.

## Deploy (GitHub Pages)

Repo Settings → Pages → "Deploy from a branch" → select your branch, root folder. The site serves `index.html` directly.
