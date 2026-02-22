// ===== PRODUCT DETAIL PAGE SCRIPT =====
let allProducts = [];
let currentProduct = null;
let suggestedProducts = [];
let cart = [];

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

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadAndDisplayProduct();
    initializeEventListeners();
    initWhatsApp();
});

// ===== LOAD AND DISPLAY SINGLE PRODUCT (with caching) =====
async function loadAndDisplayProduct() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            document.getElementById('productDetailContainer').innerHTML =
                '<div class="loading">Product not found. Please go back and select a product.</div>';
            return;
        }

        // Step 1: Check for cached products (instant load)
        let data = getCachedProducts();
        
        if (!data) {
            // Cache miss - fetch from Google Sheets or products.json
            if (CONFIG.useGoogleSheets && CONFIG.googleSheetCSVUrl) {
                try {
                    data = await fetchFromGoogleSheets();
                    setCachedProducts(data);
                } catch (sheetError) {
                    console.warn('Google Sheets fetch failed, falling back to products.json:', sheetError);
                }
            }

            if (!data) {
                const response = await fetch('products.json');
                data = await response.json();
                setCachedProducts(data);
            }
        }

        allProducts = processProducts(data);
        currentProduct = allProducts.find(p => p.id === productId);

        if (!currentProduct) {
            document.getElementById('productDetailContainer').innerHTML =
                '<div class="loading">Product not found.</div>';
            return;
        }

        // Update page title
        document.title = `${currentProduct.baseName} - Century17Toys`;

        renderProductDetail();
        loadSuggestedProducts();
    } catch (error) {
        console.error('Error loading product:', error);
        document.getElementById('productDetailContainer').innerHTML =
            '<div class="loading">Error loading product details.</div>';
    }
}

// ===== GOOGLE SHEETS CSV FETCH =====
function getSheetCSVUrl(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        const sheetId = match[1];
        const gidMatch = url.match(/gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
    return url;
}

async function fetchFromGoogleSheets() {
    const csvUrl = getSheetCSVUrl(CONFIG.googleSheetCSVUrl);
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
        });
    });
}

// ===== CONVERT YOUTUBE URL TO EMBED FORMAT =====
function getEmbedYoutubeUrl(url) {
    if (!url) return '';
    
    // Already in embed format
    if (url.includes('youtube.com/embed/')) return url;
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    // Format: https://www.youtube.com/watch?v=xxxxx
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
    }
    // Format: https://youtu.be/xxxxx
    else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // Format: https://www.youtube.com/embed/xxxxx
    else if (url.includes('youtube.com/embed/')) {
        return url;
    }
    
    // Return embed URL if we found a video ID
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
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
            youtubeVideo: getEmbedYoutubeUrl(item.youtube_video),
            category: item.category_type,
            price: parseFloat(item.price) || 0,
            size: item.size,
            color: item.color,
            fabric: item.fabric_type,
            incrementBy: incrementBy
        };
    }).filter(p => p.id && p.name);
}

// ===== RENDER PRODUCT DETAIL =====
function renderProductDetail() {
    const container = document.getElementById('productDetailContainer');

    const cartItem = cart.find(item => item.productId === currentProduct.id);
    const inCart = !!cartItem;
    const cartQuantity = cartItem ? cartItem.quantity : 0;

    // Find other variants of the same product
    const variants = allProducts.filter(p =>
        p.productId === currentProduct.productId && p.id !== currentProduct.id
    );

    // Product-level WhatsApp inquiry removed (use site-level WhatsApp float/footer instead)

    const detailHTML = `
        <div class="product-detail-wrapper">
            <!-- Images Gallery -->
            <div class="product-gallery">
                <div class="main-image-container">
                    <img id="mainImage" src="${currentProduct.imageFront}"
                         alt="${currentProduct.name}"
                         onerror="this.src='https://placehold.co/600x600/f0fdfa/0f766e?text=${encodeURIComponent(currentProduct.baseName)}'">
                </div>
                <div class="thumbnail-grid">
                    <div class="thumbnail-wrapper active" onclick="switchImage('${currentProduct.imageFront}', this)">
                        <img class="thumbnail" src="${currentProduct.imageFront}" alt="Front View"
                             onerror="this.src='https://placehold.co/100x100/f0fdfa/0f766e?text=Front'">
                        <span class="thumbnail-label">Front</span>
                    </div>
                    <div class="thumbnail-wrapper" onclick="switchImage('${currentProduct.imageTop}', this)">
                        <img class="thumbnail" src="${currentProduct.imageTop}" alt="Top View"
                             onerror="this.src='https://placehold.co/100x100/f0fdfa/0f766e?text=Top'">
                        <span class="thumbnail-label">Top</span>
                    </div>
                    <div class="thumbnail-wrapper" onclick="switchImage('${currentProduct.imageSide}', this)">
                        <img class="thumbnail" src="${currentProduct.imageSide}" alt="Side View"
                             onerror="this.src='https://placehold.co/100x100/f0fdfa/0f766e?text=Side'">
                        <span class="thumbnail-label">Side</span>
                    </div>
                    <div class="thumbnail-wrapper" onclick="switchImage('${currentProduct.imageProjection}', this)">
                        <img class="thumbnail" src="${currentProduct.imageProjection}" alt="360 View"
                             onerror="this.src='https://placehold.co/100x100/f0fdfa/0f766e?text=360'">
                        <span class="thumbnail-label">360°</span>
                    </div>
                </div>
            </div>

            <!-- Product Information -->
            <div class="product-info-detail">
                <h1 class="product-title">${currentProduct.name}</h1>

                <div class="product-category-badge">
                    <span class="badge">${currentProduct.category}</span>
                </div>

                <div class="product-specs">
                    <div class="spec-item">
                        <span class="spec-label">Size</span>
                        <span class="spec-value">${currentProduct.size || '—'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Color</span>
                        <span class="spec-value">${currentProduct.color || '—'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Material</span>
                        <span class="spec-value">${currentProduct.fabric || '—'}</span>
                    </div>
                </div>

                ${variants.length > 0 ? `
                    <div class="variant-switcher">
                        <div class="variant-switcher-label">Other Variants</div>
                        <div class="variant-options">
                            <span class="variant-option active">${[currentProduct.size, currentProduct.color].filter(Boolean).join(' - ')}</span>
                            ${variants.map(v => `
                                <a href="product-detail.html?id=${v.id}" class="variant-option">
                                    ${[v.size, v.color].filter(Boolean).join(' - ')}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="price-section">
                    <span class="price">₹${currentProduct.price.toFixed(2)}</span>
                    ${currentProduct.incrementBy > 1 ? `<div class="moq-info">MOQ: ${currentProduct.incrementBy}</div>` : ''}
                </div>

                <div class="product-actions">
                    ${inCart ? `
                        <div class="cart-controls">
                            <button class="qty-btn-detail" onclick="updateProductQuantityDetail('${currentProduct.id}', -1)">−</button>
                            <span class="qty-display-detail">${cartQuantity}</span>
                            <button class="qty-btn-detail" onclick="updateProductQuantityDetail('${currentProduct.id}', 1)">+</button>
                            <button class="remove-from-cart-btn" onclick="removeFromCartById('${currentProduct.id}')">Remove</button>
                        </div>
                    ` : `
                        <button class="add-to-cart-btn btn-large" onclick="addToCart('${currentProduct.id}')">
                            Add to Cart
                        </button>
                    `}
                </div>

                

                <div class="product-description-section">
                    <h3>Product Description</h3>
                    <p class="product-description">
                        Premium quality ${currentProduct.baseName} made with ${currentProduct.fabric || 'high-quality'} material.
                        Perfect for kids and collectors. Available in ${currentProduct.color || 'various'} color${currentProduct.size ? `, size: ${currentProduct.size}` : ''}.
                        This delightful toy is soft, cuddly, and safe for children of all ages.
                    </p>
                </div>
            </div>
        </div>

        ${currentProduct.youtubeVideo ? `
            <div class="video-section">
                <h2>Product Video</h2>
                <div class="video-container">
                    <iframe width="100%" height="500"
                            src="${currentProduct.youtubeVideo}"
                            title="Product Video" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen></iframe>
                </div>
            </div>
        ` : ''}
    `;

    container.innerHTML = detailHTML;
}

// ===== IMAGE SWITCHING =====
function switchImage(imageSrc, thumbnailEl) {
    const mainImage = document.getElementById('mainImage');
    mainImage.style.opacity = '0.6';
    setTimeout(() => {
        mainImage.src = imageSrc;
        mainImage.style.opacity = '1';
    }, 150);

    // Update active thumbnail
    if (thumbnailEl) {
        document.querySelectorAll('.thumbnail-wrapper').forEach(el => el.classList.remove('active'));
        thumbnailEl.classList.add('active');
    }
}

// ===== SUGGESTED PRODUCTS =====
function loadSuggestedProducts() {
    if (!currentProduct || !allProducts) return;

    const sameCategory = allProducts.filter(p =>
        p.category === currentProduct.category && p.id !== currentProduct.id
    );

    const otherProducts = allProducts.filter(p =>
        p.category !== currentProduct.category
    );

    suggestedProducts = [
        ...shuffle(sameCategory).slice(0, 3),
        ...shuffle(otherProducts).slice(0, 3)
    ].slice(0, 6);

    renderSuggestedProducts();
}

function renderSuggestedProducts() {
    const grid = document.getElementById('suggestedProductsGrid');

    if (suggestedProducts.length === 0) {
        grid.innerHTML = '<div class="loading">No similar products found.</div>';
        return;
    }

    grid.innerHTML = suggestedProducts.map(product => {
        const cartItem = cart.find(item => item.productId === product.id);
        const inCart = !!cartItem;
        const cartQuantity = cartItem ? cartItem.quantity : 0;

        return `
            <div class="product-card suggestion-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy"
                         onerror="this.src='https://placehold.co/400x400/f0fdfa/0f766e?text=${encodeURIComponent(product.baseName || product.name)}'"
                         onclick="navigateToProduct('${product.id}')" style="cursor:pointer;">
                    ${product.incrementBy > 1 ? `<div class="moq-badge">MOQ: ${product.incrementBy}</div>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name" onclick="navigateToProduct('${product.id}')" style="cursor:pointer;">${product.name}</h3>
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
        `;
    }).join('');
}

function navigateToProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// ===== CART FUNCTIONS =====
function loadCart() {
    const saved = localStorage.getItem('century17_cart');
    cart = saved ? JSON.parse(saved) : [];
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('century17_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
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
    renderProductDetail();
    showCartAnimation();
}

function updateProductQuantity(productId, delta) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;
    const cartItemIndex = cart.findIndex(item => item.productId === productId);

    if (cartItemIndex >= 0) {
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[cartItemIndex].quantity += change;
        if (cart[cartItemIndex].quantity <= 0) cart.splice(cartItemIndex, 1);
        saveCart();
        renderSuggestedProducts();
    }
}

function updateProductQuantityDetail(productId, delta) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;
    const cartItemIndex = cart.findIndex(item => item.productId === productId);

    if (cartItemIndex >= 0) {
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[cartItemIndex].quantity += change;
        if (cart[cartItemIndex].quantity <= 0) cart.splice(cartItemIndex, 1);
        saveCart();
        renderProductDetail();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function removeFromCartById(productId) {
    const index = cart.findIndex(item => item.productId === productId);
    if (index >= 0) {
        removeFromCart(index);
        renderProductDetail();
    }
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

function updateCartQuantity(index, delta) {
    if (cart[index]) {
        const incrementBy = cart[index].incrementBy || 1;
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        saveCart();
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
    }

    cart = [];
    saveCart();

    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('successModal').classList.add('active');
    document.getElementById('checkoutForm').reset();
}

// ===== WHATSAPP =====
function initWhatsApp() {
    // Only enable the site-level WhatsApp links on the main page (index).
    const path = window.location.pathname || '';
    const isHome = path === '/' || path === '' || path.endsWith('/index.html') || path.endsWith('index.html');

    const whatsappFloat = document.getElementById('whatsappFloat');
    const footerWhatsapp = document.getElementById('footerWhatsapp');

    if (!isHome) {
        // Ensure product/detail pages don't show the float button
        if (whatsappFloat) whatsappFloat.style.display = 'none';
        return;
    }

    if (CONFIG.whatsappNumber) {
        const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
        if (whatsappFloat) {
            whatsappFloat.href = url;
            whatsappFloat.style.display = 'flex';
        }
        if (footerWhatsapp) footerWhatsapp.href = url;
    }
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Search (redirects to home page)
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const term = e.target.value.trim();
            if (term) {
                window.location.href = `index.html?search=${encodeURIComponent(term)}`;
            }
        }
    });

    // Cart
    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    });

    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('active');
    });

    document.getElementById('checkoutForm').addEventListener('submit', submitOrder);

    document.getElementById('closeSuccess').addEventListener('click', () => {
        document.getElementById('successModal').classList.remove('active');
    });

    document.getElementById('overlay').addEventListener('click', () => {
        closeCart();
        document.getElementById('checkoutModal').classList.remove('active');
    });
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// ===== UTILITY =====
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
