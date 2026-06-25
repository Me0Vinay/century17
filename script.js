// ===== STATE MANAGEMENT =====
// Shared helpers (config, convertDriveLink, parseCSV, processProducts,
// showCartAnimation, formatPrice, shuffle, cache constants) live in common.js,
// which is loaded before this file.
let products = [];
let filteredProducts = [];
let cart = [];
// Live min-billing + discount settings (from the Settings tab; config.js
// defaults until the fetch resolves). Helpers live in common.js.
let storeSettings = defaultSettings();

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadProducts();
    initializeEventListeners();
    handleURLParameters();
    loadStoreSettings().then(s => { storeSettings = s; updateCartUI(); });
});

// ===== LOAD PRODUCTS =====
// Live: pulls the catalog straight from the Google Sheet (gviz) so editing the
// sheet updates the published site automatically. Falls back to the bundled
// products.json if the sheet can't be reached. getSheetCSV() is in common.js.
async function loadProducts() {
    try {
        const data = parseCSV(await getSheetCSV());
        products = processProducts(data);
        filteredProducts = [...products];
        renderProducts();
        populateCategoryFilter();
    } catch (error) {
        console.error('Live sheet unavailable, using bundled products.json:', error);
        try {
            const fallback = await fetch('products.json', { cache: 'no-cache' });
            const data = await fallback.json();
            products = processProducts(data);
            filteredProducts = [...products];
            renderProducts();
            populateCategoryFilter();
        } catch (e) {
            document.getElementById('productsGrid').innerHTML =
                '<div class="loading">Error loading products. Please try again later.</div>';
        }
    }
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const count = document.getElementById('productsCount');

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div class="loading">No products found matching your filters.</div>';
        count.textContent = '0 products';
        return;
    }

    count.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`;

    grid.innerHTML = filteredProducts.map(product => {
        // Check if product is in cart
        const cartItem = cart.find(item => item.productId === product.id);
        const inCart = !!cartItem;
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        const incrementBy = product.incrementBy || 1;

        return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image" onclick="navigateToProductDetail('${product.id}')">
                <img src="${product.image}" alt="${product.name}" loading="lazy" 
                     style="cursor: pointer;"
                     onerror="this.src='https://via.placeholder.com/400x400/f5f3ff/8b5cf6?text=${encodeURIComponent(product.name)}'">
                ${incrementBy > 1 ? `<div class="moq-badge">MOQ: ${incrementBy}</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name" onclick="navigateToProductDetail('${product.id}')" style="cursor: pointer;">${product.name}</h3>
                <div class="product-meta">
                    <span class="product-tag">${product.category}</span>
                </div>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                ${inCart ? `
                    <div class="product-qty-controls">
                        <button class="qty-btn-product" onclick="updateProductQuantity('${product.id}', -1)">−</button>
                        <span class="qty-display-product">${cartQuantity}</span>
                        <button class="qty-btn-product" onclick="updateProductQuantity('${product.id}', 1)">+</button>
                    </div>
                ` : `
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                        Add to Cart
                    </button>
                `}
            </div>
        </div>
    `}).join('');
}

// ===== FILTERS =====
function populateCategoryFilter() {
    const categories = [...new Set(products.map(p => p.category))];
    const select = document.getElementById('categoryFilter');

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// Secret command: typing this in the search box force-refreshes the catalog
// straight from the live Google Sheet (clears the cache, re-pulls, re-renders).
// NOTE: GitHub Pages has no backend, so this cannot rewrite/commit the
// products.json file — but because the store reads the sheet live, this gives
// you the same effect: the newest sheet data, on demand, right now.
const REFRESH_COMMAND = 'refreshmerightnow';

async function forceRefresh() {
    const grid = document.getElementById('productsGrid');
    document.getElementById('searchInput').value = '';
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_KEY + '_time');
    if (grid) grid.innerHTML = '<div class="loading">🔄 Refreshing catalog from the live sheet…</div>';
    await loadProducts(); // cache cleared, so this re-pulls fresh data
}

function applyFilters() {
    const typed = document.getElementById('searchInput').value.trim().toLowerCase();

    // Intercept the secret refresh command before normal filtering.
    if (typed === REFRESH_COMMAND) {
        forceRefresh();
        return;
    }

    // Admin command: open the password-gated store-settings panel.
    if (typed === ((typeof CONFIG !== 'undefined' && CONFIG.adminCommand) || 'update_value')) {
        document.getElementById('searchInput').value = '';
        requestAdminAccess();
        return;
    }

    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    const sort = document.getElementById('sortFilter').value;

    filteredProducts = products.filter(product => {
        // Safe string for category
        const safeCategory = product.category || "";
        const safeName = product.name || "";

        // Search filter
        const matchesSearch = safeName.toLowerCase().includes(search) ||
            safeCategory.toLowerCase().includes(search);

        // Category filter
        const matchesCategory = category === 'all' || safeCategory === category;

        // Price filter
        let matchesPrice = true;
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            matchesPrice = product.price >= min && product.price <= max;
        }

        return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sorting
    if (sort === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderProducts();
}

// ===== CART MANAGEMENT =====
function loadCart() {
    const saved = localStorage.getItem('century17_cart');
    cart = saved ? JSON.parse(saved) : [];
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('century17_cart', JSON.stringify(cart));
    updateCartUI();
    renderProducts(); // Re-render products to update quantity controls
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;

    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += incrementBy; // Use custom increment
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            size: product.size,
            color: product.color,
            fabric: product.fabric,
            quantity: incrementBy, // Start with increment value
            incrementBy: incrementBy // Store for future reference
        });
    }

    saveCart();
    showCartAnimation();
}

function updateCartQuantity(index, delta) {
    if (cart[index]) {
        const incrementBy = cart[index].incrementBy || 1;
        const change = delta > 0 ? incrementBy : -incrementBy; // Use increment for both + and -
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

// Update product quantity from product card
function updateProductQuantity(productId, delta) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;

    const cartItemIndex = cart.findIndex(item => item.productId === productId);

    if (cartItemIndex >= 0) {
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[cartItemIndex].quantity += change;

        if (cart[cartItemIndex].quantity <= 0) {
            cart.splice(cartItemIndex, 1);
        }
        saveCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const disc = computeDiscount(totalPrice, storeSettings);

    count.textContent = totalItems;
    // Footer "Total" shows the payable amount (after any tier discount).
    total.textContent = formatINR(disc.total);

    // Min-billing + discount breakdown, injected once into the cart footer.
    const footer = document.querySelector('.cart-footer');
    let note = document.getElementById('cartSummaryNote');
    if (footer && !note) {
        note = document.createElement('div');
        note.id = 'cartSummaryNote';
        note.className = 'cart-summary-note';
        footer.insertBefore(note, footer.firstChild);
    }
    if (note) note.innerHTML = cart.length ? cartSummaryNoteHTML(totalPrice, storeSettings) : '';

    if (cart.length === 0) {
        items.innerHTML = `
            <div class="empty-cart">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
                <small>Add some toys to get started!</small>
            </div>
        `;
        checkoutBtn.disabled = true;
    } else {
        items.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/80x80/f5f3ff/8b5cf6?text=Toy'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-variant">
                        ${[item.size, item.color, item.fabric].filter(Boolean).join(' • ')}
                    </div>
                    <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateCartQuantity(${index}, -1)">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
    }
}

// ===== CHECKOUT =====
function openCheckout() {
    const modal = document.getElementById('checkoutModal');
    const summaryItems = document.getElementById('orderSummaryItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Block checkout when the cart is below the minimum billing value.
    if (!meetsMinBilling(totalPrice, storeSettings)) {
        showBillingPopup(totalPrice, storeSettings);
        return;
    }

    const disc = computeDiscount(totalPrice, storeSettings);

    let summaryHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    if (disc.amount > 0) {
        summaryHTML += `
        <div class="summary-item"><span>Subtotal</span><span>${formatINR(totalPrice)}</span></div>
        <div class="summary-item summary-discount"><span>Discount (${disc.percent}%)</span><span>−${formatINR(disc.amount)}</span></div>`;
    }

    summaryItems.innerHTML = summaryHTML;
    checkoutTotal.textContent = formatINR(disc.total);

    modal.classList.add('active');
    closeCart();
}

async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById('customerName').value;
    const mobile = document.getElementById('customerMobile').value;
    const address = document.getElementById('customerAddress').value;

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Safety net: never let an under-minimum order through, even if the modal
    // was opened before settings loaded.
    if (!meetsMinBilling(totalPrice, storeSettings)) {
        document.getElementById('checkoutModal').classList.remove('active');
        showBillingPopup(totalPrice, storeSettings);
        return;
    }

    const disc = computeDiscount(totalPrice, storeSettings);

    const orderDetails = cart.map(item =>
        `${item.name} (${[item.size, item.color].filter(Boolean).join(', ')}) × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    let productDetails = `${orderDetails}\n\nSubtotal: ${formatINR(totalPrice)}`;
    if (disc.amount > 0) productDetails += `\nDiscount (${disc.percent}%): -${formatINR(disc.amount)}`;
    productDetails += `\nTotal: ${formatINR(disc.total)}`;

    if (CONFIG.enableGoogleSheets) {
        try {
            const formData = new FormData();
            formData.append(CONFIG.formFields.productDetails, productDetails);
            formData.append(CONFIG.formFields.customerName, name);
            formData.append(CONFIG.formFields.customerMobile, mobile);
            formData.append(CONFIG.formFields.deliveryAddress, address);

            // Submit to Google Form (no-cors mode)
            await fetch(CONFIG.googleFormURL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });

            console.log('Order submitted to Google Sheets');
        } catch (error) {
            console.error('Error submitting to Google Sheets:', error);
        }
    } else {
        // Log order details when Google Sheets is disabled (for testing)
        console.log('=== ORDER DETAILS ===');
        console.log('Customer:', name);
        console.log('Mobile:', mobile);
        console.log('Address:', address);
        console.log('Products:', productDetails);
    }

    // Clear cart and show success
    cart = [];
    saveCart();

    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('successModal').classList.add('active');
    document.getElementById('checkoutForm').reset();
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Scroll animation for header and filters
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const header = document.querySelector('.header');
        const filters = document.querySelector('.filters-section');
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down
            if (header) header.style.transform = 'translateY(-100%)';
            if (filters) filters.style.transform = 'translateY(calc(-100% - 100px))';
        } else {
            // Scrolling up
            if (header) header.style.transform = 'translateY(0)';
            if (filters) filters.style.transform = 'translateY(0)';
        }
        lastScrollY = currentScrollY;
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', applyFilters);

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

    // Cart
    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    });

    document.getElementById('closeCart').addEventListener('click', closeCart);

    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

    // Checkout Modal
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('active');
    });

    document.getElementById('checkoutForm').addEventListener('submit', submitOrder);

    // Success Modal
    document.getElementById('closeSuccess').addEventListener('click', () => {
        document.getElementById('successModal').classList.remove('active');
    });

    // Overlay
    document.getElementById('overlay').addEventListener('click', () => {
        closeCart();
        document.getElementById('checkoutModal').classList.remove('active');
    });
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// ===== PRODUCT NAVIGATION =====
function navigateToProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// ===== HANDLE URL SEARCH PARAMETER =====
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
        document.getElementById('searchInput').value = decodeURIComponent(searchParam);
        applyFilters();
    }
}
