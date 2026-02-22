// ===== STATE MANAGEMENT =====
let products = [];
let filteredProducts = [];
let cart = [];
let searchDebounceTimer = null;

// ===== CACHE CONFIGURATION =====
const CACHE_KEY = 'century17_products_cache';
const CACHE_TIME_KEY = 'century17_products_cache_time';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// ===== CACHE FUNCTIONS =====
function getCachedProducts() {
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (!cached || !cacheTime) return null;
    
    const age = Date.now() - parseInt(cacheTime);
    if (age > CACHE_TTL) {
        // Cache expired, clear it
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
        return null;
    }
    
    try {
        return JSON.parse(cached);
    } catch (e) {
        console.warn('Error parsing cached products:', e);
        return null;
    }
}

function setCachedProducts(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        console.log('Products cached for 12 hours');
    } catch (e) {
        console.warn('Error caching products:', e);
    }
}

function clearProductsCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
}

// ===== PRICE RANGE LABELS =====
const priceRangeLabels = {
    '0-50': 'Under ₹50',
    '50-100': '₹50-₹100',
    '100-200': '₹100-₹200',
    '200-500': '₹200-₹500',
    '500-1000': '₹500-₹1000',
    '1000-2000': '₹1000-₹2000',
    '2000-99999': 'Above ₹2000'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadProducts();
    initializeEventListeners();
    handleURLParameters();
    initWhatsApp();

    // Hidden force sync trigger in search box
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', async () => {
            if (searchInput.value.trim().toLowerCase() === 'refresh_me_right_now') {
                searchInput.value = '';
                clearProductsCache();
                document.getElementById('productsGrid').innerHTML = '<div class="loading">Syncing with Google Sheets...</div>';
                try {
                    const data = await fetchFromGoogleSheets();
                    setCachedProducts(data);
                    products = processProducts(data);
                    filteredProducts = [...products];
                    renderProducts();
                    populateCategoryFilter();
                    updateHeroStats();
                    document.getElementById('productsGrid').innerHTML = '';
                    alert('Force sync complete! Data refreshed from Google Sheets.');
                } catch (err) {
                    document.getElementById('productsGrid').innerHTML = '<div class="loading">Sync failed. Please try again later.</div>';
                }
            }
        });
    }
});

// ===== LOAD PRODUCTS (with caching strategy) =====
async function loadProducts() {
    try {
        let data;

        // Step 1: Check for cached products (instant load)
        const cachedData = getCachedProducts();
        if (cachedData) {
            data = cachedData;
            console.log('Loaded products from cache (12-hour TTL)');
            products = processProducts(data);
            filteredProducts = [...products];
            renderProducts();
            populateCategoryFilter();
            updateHeroStats();
            
            // Step 2: Silently update cache in background if enabled
            if (CONFIG.useGoogleSheets && CONFIG.googleSheetCSVUrl) {
                updateCacheInBackground();
            }
            return;
        }

        // Cache miss - fetch from Google Sheets or products.json
        if (CONFIG.useGoogleSheets && CONFIG.googleSheetCSVUrl) {
            try {
                data = await fetchFromGoogleSheets();
                console.log('Loaded products from Google Sheets');
                setCachedProducts(data);
            } catch (sheetError) {
                console.warn('Google Sheets fetch failed, falling back to products.json:', sheetError);
            }
        }

        // Fallback to products.json if Google Sheets failed or not configured
        if (!data) {
            const response = await fetch('products.json');
            data = await response.json();
            console.log('Loaded products from products.json');
            setCachedProducts(data);
        }

        products = processProducts(data);
        filteredProducts = [...products];
        renderProducts();
        populateCategoryFilter();
        updateHeroStats();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML =
            '<div class="loading">Error loading products. Please check your data source.</div>';
    }
}

// ===== UPDATE CACHE IN BACKGROUND =====
async function updateCacheInBackground() {
    try {
        const data = await fetchFromGoogleSheets();
        setCachedProducts(data);
        console.log('Cache silently updated from Google Sheets');
    } catch (error) {
        console.warn('Background cache update failed (using existing cache):', error);
    }
}

// ===== GOOGLE SHEETS CSV FETCH =====
function getSheetCSVUrl(url) {
    // Auto-convert any Google Sheets URL to the CSV export format
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        const sheetId = match[1];
        // Extract gid if present, default to first sheet
        const gidMatch = url.match(/gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
    return url; // Return as-is if not a recognizable Google Sheets URL
}

async function fetchFromGoogleSheets() {
    const csvUrl = getSheetCSVUrl(CONFIG.googleSheetCSVUrl);
    console.log('Fetching from:', csvUrl);
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parse warnings:', results.errors);
                }
                // Papa Parse returns objects with header keys — these should match our column names
                resolve(results.data);
            },
            error: (error) => reject(error)
        });
    });
}

// ===== PROCESS PRODUCTS =====
function processProducts(data) {
    return data.map(item => {
        const incrementBy = parseInt(item.increment_by) || 1;
        const variantParts = [item.size, item.color, item.fabric_type].filter(Boolean);
        const variantName = variantParts.length > 0
            ? `${item.product_name} - ${variantParts.join(' ')}`
            : item.product_name;

        return {
            id: item.sub_product_id || item.product_id,
            productId: item.product_id,
            name: variantName,
            baseName: item.product_name,
            image: item.image_link,
            imageFront: item.image_front || item.image_link,
            imageTop: item.image_top || item.image_link,
            imageSide: item.image_side || item.image_link,
            imageProjection: item.image_projection || item.image_link,
            youtubeVideo: item.youtube_video || "",
            category: item.category_type,
            price: parseFloat(item.price) || 0,
            size: item.size,
            color: item.color,
            fabric: item.fabric_type,
            incrementBy: incrementBy
        };
    }).filter(p => p.id && p.name); // Filter out empty rows
}

// ===== UPDATE HERO STATS =====
function updateHeroStats() {
    const totalEl = document.getElementById('totalProducts');
    const catEl = document.getElementById('totalCategories');
    if (totalEl) totalEl.textContent = products.length;
    if (catEl) {
        const categories = new Set(products.map(p => p.category));
        catEl.textContent = categories.size;
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
        const cartItem = cart.find(item => item.productId === product.id);
        const inCart = !!cartItem;
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        const incrementBy = product.incrementBy || 1;

        return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image" onclick="navigateToProductDetail('${product.id}')">
                <img src="${product.image}" alt="${product.name}" loading="lazy"
                     style="cursor:pointer;"
                     onerror="this.src='https://placehold.co/400x400/f0fdfa/0f766e?text=${encodeURIComponent(product.baseName || product.name)}'">
                ${incrementBy > 1 ? `<div class="moq-badge">MOQ: ${incrementBy}</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name" onclick="navigateToProductDetail('${product.id}')" style="cursor:pointer;">${product.name}</h3>
                <div class="product-meta">
                    <span class="product-tag">${product.category}</span>
                </div>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                ${inCart ? `
                    <div class="product-qty-controls">
                        <button class="qty-btn-product" onclick="event.stopPropagation();updateProductQuantity('${product.id}', -1)">−</button>
                        <span class="qty-display-product">${cartQuantity}</span>
                        <button class="qty-btn-product" onclick="event.stopPropagation();updateProductQuantity('${product.id}', 1)">+</button>
                    </div>
                ` : `
                    <button class="add-to-cart-btn" onclick="event.stopPropagation();addToCart('${product.id}')">
                        Add to Cart
                    </button>
                `}
            </div>
        </div>
    `}).join('');
}

// ===== FILTERS =====
function populateCategoryFilter() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    const select = document.getElementById('categoryFilter');

    // Clear existing options except first
    while (select.options.length > 1) select.remove(1);

    categories.forEach(cat => {
        const count = products.filter(p => p.category === cat).length;
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = `${cat} (${count})`;
        select.appendChild(option);
    });
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    const sort = document.getElementById('sortFilter').value;

    filteredProducts = products.filter(product => {
        const matchesSearch = !search ||
            product.name.toLowerCase().includes(search) ||
            product.category.toLowerCase().includes(search) ||
            (product.color && product.color.toLowerCase().includes(search)) ||
            (product.fabric && product.fabric.toLowerCase().includes(search));

        const matchesCategory = category === 'all' || product.category === category;

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

    // Update title
    const title = document.getElementById('productsTitle');
    if (category !== 'all') {
        title.textContent = category;
    } else if (search) {
        title.textContent = `Results for "${search}"`;
    } else {
        title.textContent = 'All Toys';
    }

    renderProducts();
    updateActiveFilters();
}

// ===== ACTIVE FILTERS UI =====
function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    const tagsContainer = document.getElementById('activeFilterTags');
    if (!container || !tagsContainer) return;

    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    const search = document.getElementById('searchInput').value.trim();

    const tags = [];

    if (category !== 'all') {
        tags.push({ label: category, type: 'category' });
    }
    if (priceRange !== 'all') {
        tags.push({ label: priceRangeLabels[priceRange] || priceRange, type: 'price' });
    }
    if (search) {
        tags.push({ label: `"${search}"`, type: 'search' });
    }

    if (tags.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    tagsContainer.innerHTML = tags.map(tag => `
        <span class="filter-tag">
            ${tag.label}
            <button onclick="clearFilter('${tag.type}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </span>
    `).join('');
}

function clearFilter(type) {
    if (type === 'category') document.getElementById('categoryFilter').value = 'all';
    if (type === 'price') document.getElementById('priceFilter').value = 'all';
    if (type === 'search') document.getElementById('searchInput').value = '';
    applyFilters();
}

function clearAllFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('priceFilter').value = 'all';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortFilter').value = 'featured';
    const mobileSearch = document.getElementById('searchInputMobile');
    if (mobileSearch) mobileSearch.value = '';
    applyFilters();
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
    renderProducts();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += incrementBy;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            size: product.size,
            color: product.color,
            fabric: product.fabric,
            quantity: incrementBy,
            incrementBy: incrementBy
        });
    }

    saveCart();
    showCartAnimation();
}

function updateCartQuantity(index, delta) {
    if (cart[index]) {
        const incrementBy = cart[index].incrementBy || 1;
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
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
                     onerror="this.src='https://placehold.co/80x80/f0fdfa/0f766e?text=Toy'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-variant">
                        ${[item.size, item.color, item.fabric].filter(Boolean).join(' · ')}
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
    cartBtn.style.transform = 'scale(1.15)';
    setTimeout(() => { cartBtn.style.transform = ''; }, 200);
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

            await fetch(CONFIG.googleFormURL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });
        } catch (error) {
            console.error('Error submitting to Google Sheets:', error);
        }
    } else {
        console.log('=== ORDER DETAILS ===');
        console.log('Customer:', name, '| Mobile:', mobile);
        console.log('Address:', address);
        console.log('Products:', productDetails);
    }

    cart = [];
    saveCart();

    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('successModal').classList.add('active');
    document.getElementById('checkoutForm').reset();
}

// ===== WHATSAPP =====
function initWhatsApp() {
    const whatsappFloat = document.getElementById('whatsappFloat');
    const footerWhatsapp = document.getElementById('footerWhatsapp');

    if (CONFIG.whatsappNumber) {
        const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;

        if (whatsappFloat) {
            whatsappFloat.href = url;
            whatsappFloat.style.display = 'flex';
        }
        if (footerWhatsapp) {
            footerWhatsapp.href = url;
        }
    }
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Debounced search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            // Sync mobile search if exists
            const mobileSearch = document.getElementById('searchInputMobile');
            if (mobileSearch) mobileSearch.value = searchInput.value;
            applyFilters();
        }, 300);

        // Show/hide clear button
        const clearBtn = document.getElementById('searchClear');
        if (clearBtn) {
            clearBtn.style.display = searchInput.value ? 'block' : 'none';
        }
    });

    // Search clear button
    const searchClear = document.getElementById('searchClear');
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            applyFilters();
        });
    }

    // Mobile search toggle
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const mobileSearchExpanded = document.getElementById('mobileSearchExpanded');
    if (mobileSearchToggle && mobileSearchExpanded) {
        mobileSearchToggle.addEventListener('click', () => {
            mobileSearchExpanded.classList.toggle('active');
            if (mobileSearchExpanded.classList.contains('active')) {
                const mobileInput = document.getElementById('searchInputMobile');
                if (mobileInput) mobileInput.focus();
            }
        });
    }

    // Mobile search input
    const mobileSearchInput = document.getElementById('searchInputMobile');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                searchInput.value = mobileSearchInput.value;
                applyFilters();
            }, 300);
        });
    }

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);

    // Clear all filters
    const clearAllBtn = document.getElementById('clearAllFilters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFilters);
    }

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

// ===== NAVIGATION =====
function navigateToProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');

    if (searchParam) {
        document.getElementById('searchInput').value = decodeURIComponent(searchParam);
        applyFilters();
    }
}
