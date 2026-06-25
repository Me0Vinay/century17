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

// Group an integer the Indian way (₹15,000 / ₹1,00,000) and prefix with ₹.
// Used for the larger amounts in the billing/discount UI; item prices keep
// their existing ₹X.00 format via formatPrice().
function formatINR(n) {
    const num = Math.round(parseFloat(n) || 0);
    return '₹' + num.toLocaleString('en-IN');
}

// ===== STORE SETTINGS: minimum billing + discount tiers =====
// Source of truth is a tab in the same Google Sheet as the catalog (named by
// CONFIG.settingsSheetName, default "Settings"). The admin edits it directly in
// Google Sheets; every customer reads it live here. config.js holds the
// fallback values used when the tab can't be reached.
//
// Expected layout of the Settings tab (first row is the header, exactly these
// three column names):
//
//   key          | value  | percent
//   -------------+--------+--------
//   enabled      | TRUE   |
//   min_billing  | 15000  |
//   tier         | 50000  | 2
//   tier         | 100000 | 3.5
//   tier         | 300000 | 5
//
// Add or remove `tier` rows freely; thresholds are sorted automatically.
const SETTINGS_CACHE_KEY = 'century17_settings';

function settingsCsvUrl() {
    const name = (typeof CONFIG !== 'undefined' && CONFIG.settingsSheetName) || 'Settings';
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
}

// Link to open the spreadsheet for editing (shown in the admin panel).
function sheetEditUrl() {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
}

function defaultSettings() {
    const d = (typeof CONFIG !== 'undefined' && CONFIG.defaultStoreSettings) || {};
    return {
        enabled: d.enabled !== false,
        minBilling: parseFloat(d.minBilling) || 0,
        discountTiers: (d.discountTiers || []).map(t => ({ threshold: +t.threshold, percent: +t.percent }))
    };
}

// Merge the rows parsed from the Settings tab over the config.js defaults.
function mergeSettings(rows) {
    const s = defaultSettings();
    const tiers = [];
    let sawTier = false, sawMin = false, sawEnabled = false;
    (rows || []).forEach(r => {
        const key = String(r.key || '').trim().toLowerCase();
        const val = String(r.value || '').trim();
        if (key === 'min_billing') {
            const n = parseFloat(val);
            if (!isNaN(n)) { s.minBilling = n; sawMin = true; }
        } else if (key === 'enabled') {
            // Blank cell = leave the feature on (matches the config default);
            // only an explicit falsey value (FALSE/no/0/off) turns it off. This
            // stops an empty cell from silently disabling everything.
            if (val !== '') s.enabled = /^(true|1|yes|on)$/i.test(val);
            sawEnabled = true;
        } else if (key === 'tier') {
            const threshold = parseFloat(val);
            const percent = parseFloat(String(r.percent || '').trim());
            if (!isNaN(threshold) && !isNaN(percent)) {
                tiers.push({ threshold, percent });
                sawTier = true;
            }
        }
    });
    if (sawTier) s.discountTiers = tiers;
    s.discountTiers.sort((a, b) => a.threshold - b.threshold);
    // Did the fetched data actually look like a settings tab? (Guards against a
    // missing tab where gviz hands back an error page or the catalog instead.)
    s._hasData = sawMin || sawEnabled || sawTier;
    return s;
}

// Load the live store settings (cached for CACHE_TIME, like the catalog).
// Always resolves — falls back to config.js defaults if the sheet is down.
async function loadStoreSettings(force = false) {
    if (!force) {
        const cached = sessionStorage.getItem(SETTINGS_CACHE_KEY);
        const t = sessionStorage.getItem(SETTINGS_CACHE_KEY + '_time');
        if (cached && t && (Date.now() - parseInt(t) < CACHE_TIME)) {
            try { return JSON.parse(cached); } catch (e) { /* re-fetch below */ }
        }
    }
    try {
        const res = await fetch(settingsCsvUrl() + '&cb=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const settings = mergeSettings(parseCSV(await res.text()));
        // Only "live" if the tab really held settings; otherwise these are the
        // config.js defaults (e.g. the Settings tab hasn't been created yet).
        settings._source = settings._hasData ? 'sheet' : 'defaults';
        sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
        sessionStorage.setItem(SETTINGS_CACHE_KEY + '_time', Date.now().toString());
        return settings;
    } catch (e) {
        console.warn('Settings tab unavailable, using defaults from config.js:', e);
        const s = defaultSettings();
        s._source = 'defaults';
        return s;
    }
}

// Highest tier whose threshold the subtotal has reached wins.
function computeDiscount(subtotal, settings) {
    const s = settings || {};
    if (!s.enabled) return { percent: 0, amount: 0, total: subtotal, tier: null };
    let tier = null;
    (s.discountTiers || []).forEach(t => { if (subtotal >= t.threshold) tier = t; });
    const percent = tier ? tier.percent : 0;
    const amount = subtotal * percent / 100;
    return { percent, amount, total: subtotal - amount, tier };
}

function meetsMinBilling(subtotal, settings) {
    const s = settings || {};
    return !s.enabled || subtotal >= (s.minBilling || 0);
}

// Each tier annotated for display: reached yet? how much more to unlock it?
function discountLadder(subtotal, settings) {
    const s = settings || {};
    return (s.discountTiers || []).map(t => ({
        threshold: t.threshold,
        percent: t.percent,
        reached: subtotal >= t.threshold,
        amountMore: Math.max(0, t.threshold - subtotal)
    }));
}

// HTML for the discount ladder (shared by the customer popup and admin preview).
function discountLadderHTML(subtotal, settings) {
    const ladder = discountLadder(subtotal, settings);
    if (!ladder.length) return '';
    return `<div class="c17-tiers">` + ladder.map(t => `
        <div class="c17-tier ${t.reached ? 'reached' : ''}">
            <span class="c17-tier-when">Order ${formatINR(t.threshold)}+</span>
            <span class="c17-tier-off">${t.percent}% off</span>
            <span class="c17-tier-note">${t.reached ? '✓ unlocked' : 'add ' + formatINR(t.amountMore) + ' more'}</span>
        </div>`).join('') + `</div>`;
}

// Breakdown shown in the cart sidebar footer: minimum-billing warning,
// applied discount, and a nudge toward the next tier. Empty string when the
// feature is off or the cart is empty.
function cartSummaryNoteHTML(subtotal, settings) {
    const s = settings || {};
    if (!s.enabled || subtotal <= 0) return '';
    const parts = [];
    const d = computeDiscount(subtotal, s);

    if (!meetsMinBilling(subtotal, s)) {
        const more = formatINR((s.minBilling || 0) - subtotal);
        parts.push(`<div class="c17-cart-warn">Minimum order ${formatINR(s.minBilling)} · add <strong>${more}</strong> more</div>`);
    }
    if (d.amount > 0) {
        parts.push(`<div class="c17-cart-line"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>`);
        parts.push(`<div class="c17-cart-line discount"><span>Discount (${d.percent}%)</span><span>−${formatINR(d.amount)}</span></div>`);
    }
    const next = (s.discountTiers || []).find(t => subtotal < t.threshold);
    if (next) {
        parts.push(`<div class="c17-cart-nudge">Add <strong>${formatINR(next.threshold - subtotal)}</strong> more for ${next.percent}% off</div>`);
    }
    return parts.join('');
}

// ===== INJECTED MODALS (built in JS so both pages share them) =====
function closeInjectedModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function injectModal(id, innerHTML) {
    closeInjectedModal(id);
    const wrap = document.createElement('div');
    wrap.className = 'c17-modal-overlay';
    wrap.id = id;
    wrap.innerHTML = `<div class="c17-modal" role="dialog" aria-modal="true">${innerHTML}</div>`;
    document.body.appendChild(wrap);
    // Trigger the open transition on the next frame.
    requestAnimationFrame(() => wrap.classList.add('active'));
    // Tap the backdrop (outside the card) to dismiss.
    wrap.addEventListener('click', (e) => { if (e.target === wrap) closeInjectedModal(id); });
    return wrap;
}

// Customer popup shown when the cart is below the minimum billing value.
// Explains the minimum and shows the "order more, save more" ladder.
function showBillingPopup(subtotal, settings) {
    const min = settings.minBilling || 0;
    const needMore = Math.max(0, min - subtotal);
    const pct = min > 0 ? Math.min(100, Math.round(subtotal / min * 100)) : 0;
    injectModal('c17-billing-modal', `
        <button class="c17-modal-close" onclick="closeInjectedModal('c17-billing-modal')" aria-label="Close">×</button>
        <div class="c17-emoji">🧸</div>
        <h3 class="c17-modal-title">Minimum order is ${formatINR(min)}</h3>
        <p class="c17-modal-sub">Your cart is <strong>${formatINR(subtotal)}</strong>. Add
            <strong>${formatINR(needMore)}</strong> more to place your order.</p>
        <div class="c17-progress"><div class="c17-progress-bar" style="width:${pct}%"></div></div>
        ${discountLadderHTML(subtotal, settings) ? `<div class="c17-tiers-title">Order more, save more</div>${discountLadderHTML(subtotal, settings)}` : ''}
        <button class="submit-btn" onclick="closeInjectedModal('c17-billing-modal')">Keep Shopping</button>
    `);
}

// ===== ADMIN PANEL (gated by CONFIG.adminPassword) =====
function requestAdminAccess() {
    injectModal('c17-admin-pw', `
        <button class="c17-modal-close" onclick="closeInjectedModal('c17-admin-pw')" aria-label="Close">×</button>
        <div class="c17-emoji">🔒</div>
        <h3 class="c17-modal-title">Admin access</h3>
        <input type="password" id="c17AdminPw" class="c17-input" placeholder="Password" autocomplete="off" inputmode="text">
        <p id="c17AdminPwErr" class="c17-error" style="display:none">Incorrect password.</p>
        <button class="submit-btn" id="c17AdminPwBtn">Unlock</button>
    `);
    const tryUnlock = () => {
        const v = document.getElementById('c17AdminPw').value;
        if (v === ((typeof CONFIG !== 'undefined' && CONFIG.adminPassword) || '')) {
            closeInjectedModal('c17-admin-pw');
            openAdminPanel();
        } else {
            document.getElementById('c17AdminPwErr').style.display = 'block';
        }
    };
    document.getElementById('c17AdminPwBtn').addEventListener('click', tryUnlock);
    document.getElementById('c17AdminPw').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
    setTimeout(() => { const el = document.getElementById('c17AdminPw'); if (el) el.focus(); }, 50);
}

// Basic sanity checks so the admin catches a malformed Settings tab.
function validateSettings(s) {
    const warns = [];
    if (!(s.minBilling > 0)) warns.push('Minimum billing is 0 — customers can check out with any amount.');
    let prevThreshold = -1, prevPercent = -1;
    (s.discountTiers || []).forEach(t => {
        if (t.percent < 0 || t.percent > 100) warns.push(`Tier ${formatINR(t.threshold)}: percent ${t.percent}% looks wrong.`);
        if (t.threshold <= prevThreshold) warns.push(`Tier ${formatINR(t.threshold)}: threshold is not above the previous tier.`);
        if (t.percent <= prevPercent && prevPercent >= 0) warns.push(`Tier ${formatINR(t.threshold)}: discount isn't higher than a smaller order.`);
        prevThreshold = t.threshold; prevPercent = t.percent;
    });
    return warns;
}

async function openAdminPanel() {
    const settings = await loadStoreSettings(true); // always pull fresh for the admin
    renderAdminPanel(settings);
}

function renderAdminPanel(settings) {
    const live = settings._source === 'sheet';
    const warns = validateSettings(settings);
    const tierRows = (settings.discountTiers || []).length
        ? settings.discountTiers.map(t => `<div class="c17-tier reached"><span class="c17-tier-when">${formatINR(t.threshold)}+</span><span class="c17-tier-off">${t.percent}% off</span></div>`).join('')
        : '<p class="c17-modal-sub">No discount tiers set.</p>';

    injectModal('c17-admin', `
        <button class="c17-modal-close" onclick="closeInjectedModal('c17-admin')" aria-label="Close">×</button>
        <h3 class="c17-modal-title">Store settings</h3>
        <p class="c17-source ${live ? 'live' : 'fallback'}">${live ? '● Live from your Google Sheet' : '● Sheet unreachable — showing config.js defaults'}</p>

        <div class="c17-admin-row"><span>Feature enabled</span><strong>${settings.enabled ? 'Yes' : 'No'}</strong></div>
        <div class="c17-admin-row"><span>Minimum billing</span><strong>${formatINR(settings.minBilling)}</strong></div>

        <div class="c17-tiers-title">Discount tiers</div>
        <div class="c17-tiers">${tierRows}</div>

        ${warns.length ? `<div class="c17-warn">${warns.map(w => `<div>⚠ ${w}</div>`).join('')}</div>` : ''}

        <div class="c17-tiers-title">Preview — try a cart value</div>
        <input type="number" id="c17TestVal" class="c17-input" placeholder="e.g. 60000" inputmode="numeric">
        <div id="c17TestOut" class="c17-test-out"></div>

        <div class="c17-help">
            To change these, edit the <strong>${(typeof CONFIG !== 'undefined' && CONFIG.settingsSheetName) || 'Settings'}</strong>
            tab in your Google Sheet, then tap Refresh.
            <a href="${sheetEditUrl()}" target="_blank" rel="noopener">Open the sheet →</a>
        </div>

        <div class="c17-admin-actions">
            <button class="c17-btn-secondary" id="c17AdminRefresh">Refresh from sheet</button>
            <button class="submit-btn" onclick="closeInjectedModal('c17-admin')">Done</button>
        </div>
    `);

    const out = document.getElementById('c17TestOut');
    const testInput = document.getElementById('c17TestVal');
    const renderTest = () => {
        const v = parseFloat(testInput.value);
        if (isNaN(v)) { out.innerHTML = ''; return; }
        if (!meetsMinBilling(v, settings)) {
            const more = formatINR((settings.minBilling || 0) - v);
            out.innerHTML = `<div class="c17-test-block">⛔ Below minimum — customer is asked to add <strong>${more}</strong> more.</div>`;
            return;
        }
        const d = computeDiscount(v, settings);
        out.innerHTML = d.amount > 0
            ? `<div class="c17-test-ok">✅ Checkout allowed · ${d.percent}% off (−${formatINR(d.amount)}) · pays <strong>${formatINR(d.total)}</strong></div>`
            : `<div class="c17-test-ok">✅ Checkout allowed · no discount tier reached yet</div>`;
    };
    testInput.addEventListener('input', renderTest);
    document.getElementById('c17AdminRefresh').addEventListener('click', async () => {
        sessionStorage.removeItem(SETTINGS_CACHE_KEY);
        sessionStorage.removeItem(SETTINGS_CACHE_KEY + '_time');
        await openAdminPanel();
    });
}
