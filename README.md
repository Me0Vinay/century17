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
| `common.js` | Shared helpers: sheet config, Drive link conversion, CSV parsing, product processing |
| `products.json` | Offline fallback catalog |
| `config.js` | Google Form endpoint + store settings |
| `excel-to-json.html` | Admin tool: regenerate `products.json` from the sheet or an Excel/CSV file |
| `styles.css` | All styling |

## Updating the catalog

Just edit the Google Sheet — the live site picks it up. To refresh immediately, type `refreshmerightnow` in the store's search box (force-refetches the live data and bypasses the cache).

To regenerate the offline `products.json` fallback, open `excel-to-json.html`, type `refreshmerightnow`, download the file, and commit it.

## Deploy (GitHub Pages)

Repo Settings → Pages → "Deploy from a branch" → select your branch, root folder. The site serves `index.html` directly.
