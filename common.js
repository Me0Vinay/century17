// ===== SHARED HELPERS =====
// Loaded by both index.html and product-detail.html (after config.js,
// before the page-specific script). Keeping these here means a fix only
// has to be made once, instead of in two copies that can drift apart.

// ===== GOOGLE SHEET CONFIG =====
const SHEET_ID = '17d5ZsULSFn9J-xxkMcVxwSseVdZ6q8ENE58S9wV-xKo';
// Use the gviz CSV endpoint: it returns proper CORS headers for browser
// fetch() (works from github.io), unlike export?format=csv which redirects
// cross-origin and often fails with "Failed to fetch".
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

// Short in-session cache so moving between pages doesn't refetch the sheet
// every time. New tab/session, or after this window, pulls fresh data.
const CACHE_KEY = 'century17_data';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Fetch the catalog CSV live from the Google Sheet, using the session cache
// when it's fresh. Throws if the sheet can't be reached (callers fall back
// to the bundled products.json).
async function getSheetCSV() {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cacheTime = sessionStorage.getItem(CACHE_KEY + '_time');
    if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_TIME)) {
        return cached;
    }
    const res = await fetch(SHEET_CSV_URL + '&cb=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch Google Sheet (HTTP ' + res.status + ')');
    const csvText = await res.text();
    sessionStorage.setItem(CACHE_KEY, csvText);
    sessionStorage.setItem(CACHE_KEY + '_time', Date.now().toString());
    return csvText;
}

// ===== GOOGLE DRIVE IMAGE LINKS =====
// Pull the file ID out of any common Google Drive link format:
//   https://drive.google.com/file/d/<ID>/view?usp=drive_link
//   https://drive.google.com/open?id=<ID>
//   https://drive.google.com/uc?export=view&id=<ID>
//   https://drive.google.com/thumbnail?id=<ID>&sz=w1000
function extractDriveId(url) {
    let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    return '';
}

// Convert a Google Drive share link to a direct, high-quality image URL.
// Uses the Drive "thumbnail" endpoint, which reliably serves images inside
// <img> tags (the old uc?export=view endpoint is frequently blocked by Google).
// NOTE: the Drive file must be shared as "Anyone with the link can view".
function convertDriveLink(url) {
    if (!url) return '';
    const id = extractDriveId(url);
    if (id) {
        // sz=w2000 requests a large, high-resolution render of the image.
        return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
    }
    return url;
}

// ===== CSV PARSING =====
// Full RFC-4180-style parser: handles quoted fields, commas inside quotes,
// escaped double-quotes (""), and newlines inside quoted cells.
function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { // escaped quote ("")
                    cur += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cur += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(cur);
                cur = '';
            } else if (ch === '\r') {
                // ignore carriage returns; newline handled by \n
            } else if (ch === '\n') {
                row.push(cur);
                cur = '';
                rows.push(row);
                row = [];
            } else {
                cur += ch;
            }
        }
    }
    // Flush the final field/row (file may not end with a newline)
    if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
    }

    // Drop fully-empty rows
    const dataRows = rows.filter(r => r.some(v => v.trim() !== ''));
    if (dataRows.length < 2) return [];

    const headers = dataRows[0].map(h => h.trim());
    const out = [];
    for (let i = 1; i < dataRows.length; i++) {
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = (dataRows[i][idx] || '').trim();
        });
        out.push(obj);
    }
    return out;
}

// ===== PRODUCT PROCESSING =====
// Each row in the sheet/JSON is one purchasable variant.
function processProducts(data) {
    return data.map(item => {
        const incrementBy = parseInt(item.increment_by) || 1;

        // Build a variant-aware display name
        const variantParts = [item.size, item.color, item.fabric_type].filter(Boolean);
        const variantName = variantParts.length > 0
            ? `${item.product_name} - ${variantParts.join(' ')}`
            : item.product_name;

        // Normalize any Google Drive links into direct image URLs
        const imageLink = convertDriveLink(item.image_link);
        const imageFront = convertDriveLink(item.image_front || item.image_link);
        const imageTop = convertDriveLink(item.image_top || item.image_link);
        const imageSide = convertDriveLink(item.image_side || item.image_link);
        const imageProjection = convertDriveLink(item.image_projection || item.image_link);

        return {
            id: item.sub_product_id || item.product_id,
            productId: item.product_id,
            name: variantName,
            baseName: item.product_name,
            image: imageLink,
            imageFront: imageFront,
            imageTop: imageTop,
            imageSide: imageSide,
            imageProjection: imageProjection,
            youtubeVideo: item.youtube_video || "",
            category: item.category_type || "Uncategorized",
            price: parseFloat(item.price) || 0,
            size: item.size,
            color: item.color,
            fabric: item.fabric_type,
            incrementBy: incrementBy
        };
    });
}

// ===== SMALL UTILITIES =====
function showCartAnimation() {
    const cartBtn = document.getElementById('cartBtn');
    if (!cartBtn) return;
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartBtn.style.transform = 'scale(1)';
    }, 200);
}

function formatPrice(price) {
    return `₹${parseFloat(price).toFixed(2)}`;
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
