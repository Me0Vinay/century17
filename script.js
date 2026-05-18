// ===== STATE MANAGEMENT =====
let products = [];
let filteredProducts = [];
let cart = [];

// ===== GOOGLE SHEET CONFIG =====
const SHEET_ID = '17d5ZsULSFn9J-xxkMcVxwSseVdZ6q8ENE58S9wV-xKo';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

// Convert Google Drive "view" link to direct image URL
function convertDriveLink(url) {
    if (!url) return '';
    // Match Google Drive file view links
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
}

// Parse CSV text into array of objects
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let cur = '';
        let inQuotes = false;
        for (let c = 0; c < lines[i].length; c++) {
            const ch = lines[i][c];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                values.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        values.push(cur.trim());
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
        rows.push(obj);
    }
    return rows;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadProducts();
    initializeEventListeners();
    handleURLParameters();
});

// ===== LOAD PRODUCTS =====
const CACHE_KEY = 'century17_data';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

async function loadProducts() {
    try {
        let csvText;
        const cached = sessionStorage.getItem(CACHE_KEY);
        const cacheTime = sessionStorage.getItem(CACHE_KEY + '_time');

        if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_TIME)) {
            csvText = cached;
        } else {
            const response = await fetch(SHEET_CSV_URL);
            if (!response.ok) throw new Error('Failed to fetch Google Sheet');
            csvText = await response.text();
            sessionStorage.setItem(CACHE_KEY, csvText);
            sessionStorage.setItem(CACHE_KEY + '_time', Date.now().toString());
        }

        const data = parseCSV(csvText);
        products = processProducts(data);
        filteredProducts = [...products];
        renderProducts();
        populateCategoryFilter();
    } catch (error) {
        console.error('Error loading products from Google Sheets:', error);
        // Fallback to local products.json if Sheet is unavailable
        try {
            const fallback = await fetch('products.json');
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

// Process products to group variants
// Process products - each variant is a separate listing
function processProducts(data) {
    return data.map(item => {
        const incrementBy = parseInt(item.increment_by) || 1;

        // Build variant description for name
        const variantParts = [item.size, item.color, item.fabric_type].filter(Boolean);
        const variantName = variantParts.length > 0
            ? `${item.product_name} - ${variantParts.join(' ')}`
            : item.product_name;

        // Convert any Google Drive view links to direct image URLs
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

// Variants are now separate listings, so this function is no longer needed
function renderVariants(product) {
    return ''; // Each variant is its own product now
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

function applyFilters() {
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

    count.textContent = totalItems;
    total.textContent = `₹${totalPrice.toFixed(2)}`;

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

function showCartAnimation() {
    const cartBtn = document.getElementById('cartBtn');
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartBtn.style.transform = 'scale(1)';
    }, 200);
}

// ===== CHECKOUT =====
function openCheckout() {
    const modal = document.getElementById('checkoutModal');
    const summaryItems = document.getElementById('orderSummaryItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    checkoutTotal.textContent = `₹${totalPrice.toFixed(2)}`;

    modal.classList.add('active');
    closeCart();
}

async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById('customerName').value;
    const mobile = document.getElementById('customerMobile').value;
    const address = document.getElementById('customerAddress').value;

    const orderDetails = cart.map(item =>
        `${item.name} (${[item.size, item.color].filter(Boolean).join(', ')}) × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const productDetails = `${orderDetails}\n\nTotal: ₹${totalPrice.toFixed(2)}`;

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

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return `₹${parseFloat(price).toFixed(2)}`;
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
